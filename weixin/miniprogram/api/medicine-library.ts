import { get } from "../utils/request";

export function searchMedicineLibrary(keyword: string, page = 1, size = 20) {
  return get<any>(`/api/medicine-library/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`);
}

export function listMedicineLibrary(page = 1, size = 20) {
  return get<any>(`/api/medicine-library/list?page=${page}&size=${size}`);
}

export function getMedicineLibraryById(id: number) {
  return get<any>(`/api/medicine-library/${id}`);
}
