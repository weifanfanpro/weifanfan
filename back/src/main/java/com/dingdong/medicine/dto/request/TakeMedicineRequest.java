package com.dingdong.medicine.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TakeMedicineRequest {
    @NotNull(message = "reminderId不能为空")
    private Long reminderId;
    @NotBlank(message = "date不能为空")
    private String date;
}
