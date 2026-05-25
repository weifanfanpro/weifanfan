package com.dingdong.medicine.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddMedicineRequest {
    private Long medicineId;
    @NotBlank(message = "药品名称不能为空")
    private String name;
    private Boolean isQuantifiable;
    private String doseText;
    private String totalAmountText;
    private String rule;
}
