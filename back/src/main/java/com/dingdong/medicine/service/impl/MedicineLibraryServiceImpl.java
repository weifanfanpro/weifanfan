package com.dingdong.medicine.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.dingdong.medicine.common.exception.BizException;
import com.dingdong.medicine.entity.MedicineLibrary;
import com.dingdong.medicine.mapper.MedicineLibraryMapper;
import com.dingdong.medicine.service.MedicineLibraryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MedicineLibraryServiceImpl implements MedicineLibraryService {

    private final MedicineLibraryMapper medicineLibraryMapper;

    @Override
    public Page<MedicineLibrary> list(int page, int size) {
        return medicineLibraryMapper.selectPage(new Page<>(page, size), null);
    }

    @Override
    public Page<MedicineLibrary> search(String keyword, int page, int size) {
        LambdaQueryWrapper<MedicineLibrary> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(MedicineLibrary::getName, keyword)
                .or()
                .like(MedicineLibrary::getIndication, keyword)
                .or()
                .like(MedicineLibrary::getDosageSummary, keyword);
        return medicineLibraryMapper.selectPage(new Page<>(page, size), wrapper);
    }

    @Override
    public MedicineLibrary getById(Long id) {
        MedicineLibrary library = medicineLibraryMapper.selectById(id);
        if (library == null) {
            throw new BizException("药品库条目不存在");
        }
        return library;
    }
}
