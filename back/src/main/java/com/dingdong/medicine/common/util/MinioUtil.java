package com.dingdong.medicine.common.util;

import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class MinioUtil {

    private final MinioClient minioClient;

    @Value("${minio.bucket-avatars}")
    private String bucketAvatars;

    @Value("${minio.bucket-scans}")
    private String bucketScans;

    @Value("${minio.bucket-mall}")
    private String bucketMall;

    @Value("${minio.bucket-feedback}")
    private String bucketFeedback;

    @Value("${minio.endpoint}")
    private String endpoint;

    public void initBuckets() {
        createBucketIfNotExists(bucketAvatars);
        createBucketIfNotExists(bucketScans);
        createBucketIfNotExists(bucketMall);
        createBucketIfNotExists(bucketFeedback);
    }

    private void createBucketIfNotExists(String bucketName) {
        try {
            boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
                log.info("创建Bucket: {}", bucketName);
            }
            String policy = """
                    {
                      "Version": "2012-10-17",
                      "Statement": [{
                        "Effect": "Allow",
                        "Principal": {"AWS": ["*"]},
                        "Action": ["s3:GetObject"],
                        "Resource": ["arn:aws:s3:::%s/*"]
                      }]
                    }
                    """.formatted(bucketName);
            minioClient.setBucketPolicy(SetBucketPolicyArgs.builder().bucket(bucketName).config(policy).build());
        } catch (Exception e) {
            log.error("检查/创建Bucket失败: {}", bucketName, e);
        }
    }

    public String uploadAvatar(MultipartFile file, String openid) {
        String objectName = openid + "/avatar_" + System.currentTimeMillis() + getExtension(file.getOriginalFilename());
        return uploadFile(bucketAvatars, objectName, file);
    }

    public String uploadScan(MultipartFile file, String openid) {
        String date = ChinaTimeUtil.todayString();
        String objectName = openid + "/" + date + "/" + UUID.randomUUID() + getExtension(file.getOriginalFilename());
        return uploadFile(bucketScans, objectName, file);
    }

    public String uploadMallImage(MultipartFile file, String productId) {
        String objectName = "products/" + productId + "/" + UUID.randomUUID() + getExtension(file.getOriginalFilename());
        return uploadFile(bucketMall, objectName, file);
    }

    public String uploadFeedback(MultipartFile file, String openid) {
        String date = ChinaTimeUtil.todayString();
        String objectName = openid + "/" + date + "/" + UUID.randomUUID() + getExtension(file.getOriginalFilename());
        return uploadFile(bucketFeedback, objectName, file);
    }

    private String uploadFile(String bucketName, String objectName, MultipartFile file) {
        try {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build());
            return endpoint + "/" + bucketName + "/" + objectName;
        } catch (Exception e) {
            log.error("上传文件失败: {}", objectName, e);
            throw new RuntimeException("文件上传失败");
        }
    }

    public String getPresignedUrl(String bucketName, String objectName) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(objectName)
                            .expiry(7, TimeUnit.DAYS)
                            .build());
        } catch (Exception e) {
            log.error("获取预签名URL失败", e);
            return null;
        }
    }

    private String getExtension(String filename) {
        if (filename == null) return ".jpg";
        int idx = filename.lastIndexOf('.');
        return idx >= 0 ? filename.substring(idx) : ".jpg";
    }
}
