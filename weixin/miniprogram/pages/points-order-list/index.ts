import { getOrders, deleteOrder } from "../../api/mall";

type OrderItem = {
  orderId: string;
  status: string;
  pointsCost: number;
  createdAtText: string;
  firstItem?: { name?: string; cover?: string; quantity?: number } | null;
};

Page({
  data: {
    list: [] as OrderItem[],
    loading: true,
    deletingOrderId: "",
  },
  onShow() {
    this.loadList();
  },
  async loadList() {
    this.setData({ loading: true });
    try {
      const list = await getOrders();
      this.setData({ list });
    } catch {
      wx.showToast({ icon: "none", title: "加载失败" });
    } finally {
      this.setData({ loading: false });
    }
  },
  onOpenDetail(e: WechatMiniprogram.BaseEvent) {
    const { id, status } = e.currentTarget.dataset as { id?: string; status?: string };
    const orderId = String(id || "");
    if (!orderId) return;
    const st = String(status || "");
    if (st && st !== "delivered") {
      wx.navigateTo({ url: `/pages/points-order-transport/index?orderId=${encodeURIComponent(orderId)}` });
      return;
    }
    wx.navigateTo({ url: `/pages/points-order-detail/index?orderId=${encodeURIComponent(orderId)}` });
  },
  async onLongDelete(e: WechatMiniprogram.BaseEvent) {
    const { id } = e.currentTarget.dataset as { id?: string };
    const orderId = String(id || "");
    if (!orderId) return;
    const ok = await new Promise<boolean>((resolve) => {
      wx.showModal({
        title: "删除订单",
        content: "确认删除该订单记录？删除后不可恢复。",
        confirmColor: "#ef4444",
        success: (res) => resolve(!!res.confirm),
        fail: () => resolve(false),
      });
    });
    if (!ok) return;
    wx.showLoading({ title: "删除中", mask: true });
    try {
      await deleteOrder(orderId);
      this.setData({ deletingOrderId: orderId });
      wx.showToast({ icon: "success", title: "已删除" });
      setTimeout(() => {
        this.setData({
          list: (this.data.list || []).filter((x) => x.orderId !== orderId),
          deletingOrderId: "",
        });
      }, 220);
    } catch {
      wx.showToast({ icon: "none", title: "删除失败" });
    } finally {
      wx.hideLoading();
    }
  },
});

