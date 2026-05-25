import { getOrderDetail, advanceOrderStatus } from "../../api/mall";

type OrderDetail = {
  orderId: string;
  status: string;
  items: Array<{ name: string; cover: string; quantity: number; pointsPrice: number }>;
  pointsCost: number;
  pointsBalanceAfter: number;
  addressMock: { receiver: string; phone: string; region: string; detail: string } | null;
  statusTimeline: Array<{ status: string; text: string; at: any }>;
};

Page({
  data: {
    orderId: "",
    detail: null as OrderDetail | null,
    loading: true,
    advancing: false,
  },
  onShow() {
    if (this.data.orderId) this.loadDetail(this.data.orderId);
  },
  onLoad(query: Record<string, string>) {
    const orderId = String(query.orderId || "");
    this.setData({ orderId });
    this.loadDetail(orderId);
  },
  async loadDetail(orderId: string) {
    if (!orderId) return;
    this.setData({ loading: true });
    try {
      const detail = await getOrderDetail(orderId);
      this.setData({ detail });
    } catch {
      wx.showToast({ icon: "none", title: "加载失败" });
    } finally {
      this.setData({ loading: false });
    }
  },
  async onAdvanceStatus() {
    if (this.data.advancing || !this.data.orderId) return;
    this.setData({ advancing: true });
    try {
      await advanceOrderStatus(this.data.orderId);
      await this.loadDetail(this.data.orderId);
    } catch (e: any) {
      wx.showToast({ icon: "none", title: (e?.message || "推进失败").slice(0, 8) });
    } finally {
      this.setData({ advancing: false });
    }
  },
  onGoTransport() {
    if (!this.data.orderId) return;
    wx.navigateTo({ url: `/pages/points-order-transport/index?orderId=${encodeURIComponent(this.data.orderId)}` });
  },
});

