package com.dingdong.medicine.controller;

import com.dingdong.medicine.common.result.R;
import com.dingdong.medicine.dto.request.BindFamilyRequest;
import com.dingdong.medicine.dto.request.CreatePendingRequest;
import com.dingdong.medicine.entity.FamilyPendingMedicine;
import com.dingdong.medicine.service.FamilyService;
import com.dingdong.medicine.vo.FamilyRelationVO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/family")
@RequiredArgsConstructor
public class FamilyController {

    private final FamilyService familyService;

    @PostMapping("/bind")
    public R<Void> bind(HttpServletRequest request, @RequestBody BindFamilyRequest bindRequest) {
        String openid = (String) request.getAttribute("openid");
        familyService.bind(openid, bindRequest.getTargetOpenid());
        return R.ok();
    }

    @GetMapping("/relations")
    public R<List<FamilyRelationVO>> relations(HttpServletRequest request) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(familyService.getRelations(openid));
    }

    @DeleteMapping("/unbind/{relationId}")
    public R<Void> unbind(HttpServletRequest request, @PathVariable Long relationId) {
        String openid = (String) request.getAttribute("openid");
        familyService.unbind(openid, relationId);
        return R.ok();
    }

    @PostMapping("/pending")
    public R<Void> createPending(HttpServletRequest request,
                                  @Valid @RequestBody CreatePendingRequest pendingRequest) {
        String openid = (String) request.getAttribute("openid");
        familyService.createPending(openid, pendingRequest);
        return R.ok();
    }

    @GetMapping("/pending/inbox")
    public R<List<FamilyPendingMedicine>> inbox(HttpServletRequest request) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(familyService.getInbox(openid));
    }

    @GetMapping("/pending/sent")
    public R<List<FamilyPendingMedicine>> sent(HttpServletRequest request) {
        String openid = (String) request.getAttribute("openid");
        return R.ok(familyService.getSent(openid));
    }

    @PostMapping("/pending/{id}/activate")
    public R<Void> activatePending(HttpServletRequest request, @PathVariable Long id) {
        String openid = (String) request.getAttribute("openid");
        familyService.activatePending(openid, id);
        return R.ok();
    }

    @PostMapping("/pending/{id}/ignore")
    public R<Void> ignorePending(HttpServletRequest request, @PathVariable Long id) {
        String openid = (String) request.getAttribute("openid");
        familyService.ignorePending(openid, id);
        return R.ok();
    }
}
