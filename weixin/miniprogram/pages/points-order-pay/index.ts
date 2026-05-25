import { getOrderDetail, payOrder } from "../../api/mall";

Page({
  data: {
    orderId: "",
    pointsCost: 0,
    paying: false,
  },
  async onLoad(query: Record<string, string>) {
    const orderId = String(query.orderId || "");
    this.setData({ orderId });
    if (!orderId) return;
    try {
      const detail = await getOrderDetail(orderId);
      this.setData({ pointsCost: Number(detail.pointsCost || 0) });
    } catch {}
  },
  async onPay() {
    if (this.data.paying || !this.data.orderId) return;
    this.setData({ paying: true });
    try {
      await payOrder(this.data.orderId);
      wx.redirectTo({ url: `/pages/points-order-transport/index?orderId=${encodeURIComponent(this.data.orderId)}` });
    } catch (e: any) {
      wx.showToast({ icon: "none", title: (e?.message || "支付失败").slice(0, 8) });
    } finally {
      this.setData({ paying: false });
    }
  },
});

