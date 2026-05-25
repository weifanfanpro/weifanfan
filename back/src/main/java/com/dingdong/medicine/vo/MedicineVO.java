package com.dingdong.medicine.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MedicineVO {
    private Long id;
    private String name;
    private String indication;
    private String dosageSummary;
    private Boolean isQuantifiable;
    private String doseText;
    private String totalAmountText;
    private String usageMethod;
    private Integer dailyFrequency;
    private String mealTiming;
    private String suggestedSlots;
    private String warnings;
    private String contraindications;
}
