package com.dingdong.medicine;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@MapperScan("com.dingdong.medicine.mapper")
@EnableScheduling
public class DingDongApplication {
    public static void main(String[] args) {
        SpringApplication.run(DingDongApplication.class, args);
    }
}
