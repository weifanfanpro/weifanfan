package com.dingdong.medicine.controller.admin;

import com.dingdong.medicine.common.exception.BizException;
import com.dingdong.medicine.common.result.R;
import com.dingdong.medicine.entity.MedicineLibrary;
import com.dingdong.medicine.mapper.MedicineLibraryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/medicine-library")
@RequiredArgsConstructor
public class AdminMedicineLibraryController {

    private final MedicineLibraryMapper libraryMapper;

    @GetMapping("/list")
    public R<List<MedicineLibrary>> list() {
        return R.ok(libraryMapper.selectList(null));
    }

    @PostMapping
    public R<Void> save(@RequestBody MedicineLibrary body) {
        if (body.getName() == null || body.getName().isBlank()) {
            throw new BizException("药品名称不能为空");
        }
        LocalDateTime now = LocalDateTime.now();
        if (body.getId() != null) {
            body.setUpdatedAt(now);
            libraryMapper.updateById(body);
        } else {
            body.setCreatedAt(now);
            body.setUpdatedAt(now);
            if (body.getStatus() == null) body.setStatus("enabled");
            libraryMapper.insert(body);
        }
        return R.ok();
    }

    @PostMapping("/{id}/status")
    public R<Void> updateStatus(@PathVariable Long id,
                                @RequestBody Map<String, String> body) {
        MedicineLibrary drug = libraryMapper.selectById(id);
        if (drug == null) {
            throw new BizException("药品不存在");
        }
        String newStatus = body.get("status");
        if (!"enabled".equals(newStatus) && !"disabled".equals(newStatus)) {
            throw new BizException("无效的状态值");
        }
        drug.setStatus(newStatus);
        drug.setUpdatedAt(LocalDateTime.now());
        libraryMapper.updateById(drug);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id) {
        libraryMapper.deleteById(id);
        return R.ok();
    }
}
