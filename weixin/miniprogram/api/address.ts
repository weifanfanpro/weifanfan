import { get, post, put, del } from "../utils/request";

type ShippingAddress = {
  addressId: string;
  receiver: string;
  phone: string;
  region: string;
  detail: string;
  tag?: string;
  isDefault?: boolean;
};

export async function getAddressList(): Promise<{
  list: ShippingAddress[];
  defaultAddress: ShippingAddress | null;
}> {
  const list = await get<ShippingAddress[]>("/api/address/list");
  const defaultAddr = list.find((a) => a.isDefault) || null;
  return { list: list || [], defaultAddress: defaultAddr };
}

export function deleteAddress(addressId: string) {
  return del(`/api/address/${addressId}`);
}

export function setDefaultAddress(addressId: string) {
  return put(`/api/address/${addressId}/default`);
}

export function saveAddress(payload: {
  addressId?: string;
  receiver: string;
  phone: string;
  region: string;
  detail: string;
  tag?: string;
  isDefault?: boolean;
}) {
  return post("/api/address", payload);
}

export function formatAddressError(err: unknown): string {
  return err instanceof Error ? err.message : "请求失败，请稍后再试";
}
