import { get, upload } from "../utils/request";

export function getMedicineById(id: number) {
  return get<any>(`/api/medicine/${id}`);
}

export function getMedicineByName(name: string) {
  return get<any>(`/api/medicine/by-name?name=${encodeURIComponent(name)}`);
}

export function recognizeMedicine(filePath: string) {
  return upload<any>("/api/medicine/recognize", filePath);
}
