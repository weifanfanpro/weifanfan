package com.dingdong.medicine.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiChatSendRequest {
    private Long sessionId;
    @NotBlank(message = "message不能为空")
    private String message;
    private Boolean deepThinking;
    private Boolean webSearch;
    private Long consultMedicineId;
}
