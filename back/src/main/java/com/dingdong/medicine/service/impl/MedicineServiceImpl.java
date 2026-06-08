package com.dingdong.medicine.service.impl;

import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dingdong.medicine.common.exception.BizException;
import com.dingdong.medicine.common.util.MinioUtil;
import com.dingdong.medicine.common.util.RedisUtil;
import com.dingdong.medicine.entity.Medicine;
import com.dingdong.medicine.entity.MedicineLibrary;
import com.dingdong.medicine.mapper.MedicineMapper;
import com.dingdong.medicine.mapper.MedicineLibraryMapper;
import com.dingdong.medicine.service.MedicineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

import static com.dingdong.medicine.common.constant.AppConstants.REDIS_RATE_RECOGNIZE;

@Slf4j
@Service
@RequiredArgsConstructor
public class MedicineServiceImpl implements MedicineService {

    private final MedicineMapper medicineMapper;
    private final MedicineLibraryMapper medicineLibraryMapper;
    private final MinioUtil minioUtil;
    private final RedisUtil redisUtil;

    @Value("${dingdong.ocr.host}")
    private String ocrHost;

    @Value("${dingdong.ocr.path}")
    private String ocrPath;

    @Value("${dingdong.ocr.appcode}")
    private String ocrAppcode;

    @Value("${dingdong.ai.deepseek-api-key}")
    private String deepseekApiKey;

    @Value("${dingdong.ai.deepseek-model}")
    private String deepseekModel;

    @Value("${dingdong.ai.deepseek-base-url}")
    private String deepseekBaseUrl;

    @Override
    public Medicine recognize(String openid, MultipartFile file) {
        String countKey = REDIS_RATE_RECOGNIZE + openid;
        String count = redisUtil.get(countKey);
        if (count != null && Integer.parseInt(count) >= 10) {
            throw new BizException("今日识别次数已达上限");
        }

        String imageUrl = minioUtil.uploadScan(file, openid);
        // 获取预签名URL供OCR使用
        String objectName = minioUtil.extractObjectNameFromUrl(imageUrl);
        String presignedUrl = minioUtil.getPresignedScanUrl(objectName);
        log.info("图片上传成功，预签名URL: {}", presignedUrl);

        String ocrText = callOcr(presignedUrl);
        if (ocrText == null || ocrText.isBlank()) {
            throw new BizException("OCR识别失败，请重新拍照");
        }

        Medicine medicine = callLlmParse(ocrText);
        medicine.setLastScanAt(LocalDateTime.now());
        medicine.setCreatedAt(LocalDateTime.now());
        medicine.setUpdatedAt(LocalDateTime.now());
        medicineMapper.insert(medicine);

        syncToLibrary(medicine);

        redisUtil.increment(countKey);
        if (count == null) {
            redisUtil.expire(countKey, 1, TimeUnit.HOURS);
        }

        return medicine;
    }

    @Override
    public String uploadImage(String openid, MultipartFile file) {
        return minioUtil.uploadScan(file, openid);
    }

    @Override
    public Medicine getById(Long id) {
        Medicine medicine = medicineMapper.selectById(id);
        if (medicine == null) {
            throw new BizException("药品不存在");
        }
        return medicine;
    }

    @Override
    public Medicine getByName(String name) {
        return medicineMapper.selectOne(
                new LambdaQueryWrapper<Medicine>()
                        .eq(Medicine::getName, name)
                        .last("LIMIT 1"));
    }

    private String callOcr(String imageUrl) {
        try {
            JSONObject body = JSONUtil.createObj();
            body.set("url", imageUrl);
            String result = HttpUtil.createPost(ocrHost + ocrPath)
                    .header("Authorization", "APPCODE " + ocrAppcode)
                    .header("Content-Type", "application/json")
                    .body(body.toString())
                    .execute()
                    .body();
            JSONObject json = JSONUtil.parseObj(result);
            if (json.containsKey("data")) {
                return json.getStr("data");
            }
            return result;
        } catch (Exception e) {
            log.error("OCR调用失败", e);
            return null;
        }
    }

    private Medicine callLlmParse(String ocrText) {
        try {
            String prompt = "请根据以下药品说明书文字，提取结构化信息。只返回JSON格式，不要包含任何其他文字或markdown标记。\nJSON字段：name(药品名称), indication(适应症), dosageSummary(用量概要), isQuantifiable(是否可计量，布尔值), doseText(每次用量), totalAmountText(总量), usageMethod(用法：oral/topical/eye/nose/inhalation/injection/other), dailyFrequency(建议每日频次，整数), mealTiming(餐前/餐后/空腹/无：before/after/empty/none), warnings(注意事项数组), contraindications(禁忌)。\n\n药品文字：" + ocrText;

            JSONObject body = JSONUtil.createObj();
            body.set("model", deepseekModel);
            body.set("messages", JSONUtil.createArray()
                    .put(JSONUtil.createObj().set("role", "user").set("content", prompt)));
            body.set("temperature", 0.1);

            log.info("调用LLM解析，OCR文本长度: {}", ocrText.length());

            String result = HttpUtil.createPost(deepseekBaseUrl + "/chat/completions")
                    .header("Authorization", "Bearer " + deepseekApiKey)
                    .header("Content-Type", "application/json")
                    .body(body.toString())
                    .timeout(30000)
                    .execute()
                    .body();

            log.info("LLM返回结果: {}", result);

            JSONObject json = JSONUtil.parseObj(result);
            String content = json.getJSONArray("choices")
                    .getJSONObject(0)
                    .getJSONObject("message")
                    .getStr("content");

            log.info("LLM原始内容: {}", content);

            // 清理内容：移除markdown代码块标记
            String cleanedContent = content.trim();
            if (cleanedContent.startsWith("```json")) {
                cleanedContent = cleanedContent.substring(7);
            } else if (cleanedContent.startsWith("```")) {
                cleanedContent = cleanedContent.substring(3);
            }
            if (cleanedContent.endsWith("```")) {
                cleanedContent = cleanedContent.substring(0, cleanedContent.length() - 3);
            }
            cleanedContent = cleanedContent.trim();

            log.info("清理后的JSON内容: {}", cleanedContent);

            JSONObject medicineJson = JSONUtil.parseObj(cleanedContent);
            Medicine medicine = new Medicine();
            medicine.setName(medicineJson.getStr("name"));
            medicine.setIndication(medicineJson.getStr("indication"));
            medicine.setDosageSummary(medicineJson.getStr("dosageSummary"));
            medicine.setIsQuantifiable(medicineJson.getBool("isQuantifiable"));
            medicine.setDoseText(medicineJson.getStr("doseText"));
            medicine.setTotalAmountText(medicineJson.getStr("totalAmountText"));
            medicine.setUsageMethod(medicineJson.getStr("usageMethod"));
            medicine.setDailyFrequency(medicineJson.getInt("dailyFrequency"));
            medicine.setMealTiming(medicineJson.getStr("mealTiming"));
            medicine.setWarnings(medicineJson.getStr("warnings"));
            medicine.setContraindications(medicineJson.getStr("contraindications"));
            return medicine;
        } catch (Exception e) {
            log.error("LLM解析失败", e);
            throw new BizException("AI解析失败，请重试");
        }
    }

    private void syncToLibrary(Medicine medicine) {
        MedicineLibrary existing = medicineLibraryMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<MedicineLibrary>()
                        .eq(MedicineLibrary::getName, medicine.getName()));
        if (existing == null) {
            MedicineLibrary library = new MedicineLibrary();
            library.setName(medicine.getName());
            library.setIndication(medicine.getIndication());
            library.setDosageSummary(medicine.getDosageSummary());
            library.setUsageMethod(medicine.getUsageMethod());
            library.setMealTiming(medicine.getMealTiming());
            library.setDailyFrequency(medicine.getDailyFrequency());
            library.setWarnings(medicine.getWarnings());
            library.setContraindications(medicine.getContraindications());
            library.setCreatedAt(LocalDateTime.now());
            library.setUpdatedAt(LocalDateTime.now());
            medicineLibraryMapper.insert(library);
        }
    }
}
