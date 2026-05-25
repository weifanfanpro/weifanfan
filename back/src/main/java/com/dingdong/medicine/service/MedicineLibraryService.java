package com.dingdong.medicine.service;

import com.dingdong.medicine.entity.MedicineLibrary;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

public interface MedicineLibraryService {
    Page<MedicineLibrary> list(int page, int size);
    Page<MedicineLibrary> search(String keyword, int page, int size);
    MedicineLibrary getById(Long id);
}
