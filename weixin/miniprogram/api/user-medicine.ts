import { get, post, put, del } from "../utils/request";

export interface AddMedicineRequest {
  medicineId?: number;
  name: string;
  isQuantifiable?: boolean;
  doseText?: string;
  totalAmountText?: string;
  rule?: string;
}

export function addMedicine(data: AddMedicineRequest) {
  return post<any>("/api/user-medicine", data);
}

export function listMedicines(targetOpenid?: string) {
  const query = targetOpenid ? `?targetOpenid=${targetOpenid}` : "";
  return get<any[]>(`/api/user-medicine/list${query}`);
}

export function getMedicineById(id: number) {
  return get<any>(`/api/user-medicine/${id}`);
}

export function updateMedicine(id: number, fields: Record<string, any>) {
  return put(`/api/user-medicine/${id}`, fields);
}

export function deleteMedicine(id: number) {
  return del(`/api/user-medicine/${id}`);
}
