import { get, post, del } from "../utils/request";

type Product = {
  productId: string;
  name: string;
  desc: string;
  cover: string;
  pointsPrice: number;
  stockMock: number;
  category: string;
};

type OrderItem = {
  orderId: string;
  status: string;
  pointsCost: number;
  createdAtText: string;
  firstItem?: { name?: string; cover?: string; quantity?: number } | null;
};

type OrderDetail = {
  orderId: string;
  status: string;
  items: Array<{ name: string; cover: string; quantity: number; pointsPrice: number }>;
  pointsCost: number;
  pointsBalanceAfter: number;
  addressMock: { receiver: string; phone: string; region: string; detail: string } | null;
  statusTimeline: Array<{ status: string; text: string; at: any }>;
};

export function getProducts(): Promise<Product[]> {
  return get<Product[]>("/api/mall/products");
}

export function createOrder(payload: {
  productId: string;
  quantity: number;
  addressId: string;
}): Promise<any> {
  return post("/api/mall/orders", {
    addressId: payload.addressId,
    items: [{ productId: payload.productId, quantity: payload.quantity }],
  });
}

export function payOrder(orderId: string) {
  return post(`/api/mall/orders/${orderId}/advance`);
}

export function getOrders(): Promise<OrderItem[]> {
  return get<OrderItem[]>("/api/mall/orders");
}

export function getOrderDetail(orderId: string): Promise<OrderDetail> {
  return get<OrderDetail>(`/api/mall/orders/${orderId}`);
}

export function deleteOrder(orderId: string) {
  return del(`/api/mall/orders/${orderId}`);
}

export function advanceOrderStatus(orderId: string) {
  return post(`/api/mall/orders/${orderId}/advance`);
}

export function formatMallError(err: unknown): string {
  return err instanceof Error ? err.message : "请求失败，请稍后再试";
}
