package com.dingdong.medicine.controller.user;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.dingdong.medicine.common.result.R;
import com.dingdong.medicine.entity.MedicineLibrary;
import com.dingdong.medicine.service.MedicineLibraryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/medicine-library")
@RequiredArgsConstructor
public class MedicineLibraryController {

    private final MedicineLibraryService medicineLibraryService;

    @GetMapping("/list")
    public R<Page<MedicineLibrary>> list(@RequestParam(defaultValue = "1") int page,
                                          @RequestParam(defaultValue = "20") int size) {
        return R.ok(medicineLibraryService.list(page, size));
    }

    @GetMapping("/search")
    public R<Page<MedicineLibrary>> search(@RequestParam String keyword,
                                            @RequestParam(defaultValue = "1") int page,
                                            @RequestParam(defaultValue = "20") int size) {
        return R.ok(medicineLibraryService.search(keyword, page, size));
    }

    @GetMapping("/{id}")
    public R<MedicineLibrary> getById(@PathVariable Long id) {
        return R.ok(medicineLibraryService.getById(id));
    }
}
