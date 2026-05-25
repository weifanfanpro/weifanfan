import { getProducts } from "../../api/mall";

type Product = {
  productId: string;
  name: string;
  desc: string;
  cover: string;
  pointsPrice: number;
  stockMock: number;
  category: string;
};

Page({
  data: {
    product: null as Product | null,
    quantity: 1,
    loading: true,
    pointsCost: 0,
  },
  onLoad(query: Record<string, string>) {
    this.loadProduct(String(query.id || ""));
  },
  async loadProduct(productId: string) {
    this.setData({ loading: true });
    try {
      const list = await getProducts();
      const product = list.find((p) => p.productId === productId) || null;
      const quantity = this.data.quantity;
      this.setData({ product, pointsCost: Number(product?.pointsPrice || 0) * quantity });
      if (!product) wx.showToast({ icon: "none", title: "商品不存在" });
    } catch {
      wx.showToast({ icon: "none", title: "加载失败" });
    } finally {
      this.setData({ loading: false });
    }
  },
  onQuantityChange(e: WechatMiniprogram.CustomEvent<{ value: string | number }>) {
    const v = Number(e.detail?.value || 1);
    const quantity = Number.isFinite(v) ? Math.max(1, Math.min(99, Math.floor(v))) : 1;
    this.setData({ quantity, pointsCost: Number(this.data.product?.pointsPrice || 0) * quantity });
  },
  onStepDown() {
    const quantity = Math.max(1, Number(this.data.quantity || 1) - 1);
    this.setData({ quantity, pointsCost: Number(this.data.product?.pointsPrice || 0) * quantity });
  },
  onStepUp() {
    const quantity = Math.min(99, Number(this.data.quantity || 1) + 1);
    this.setData({ quantity, pointsCost: Number(this.data.product?.pointsPrice || 0) * quantity });
  },
  onGoConfirm() {
    const p = this.data.product;
    if (!p) return;
    wx.navigateTo({
      url: `/pages/points-order-confirm/index?productId=${encodeURIComponent(p.productId)}&quantity=${this.data.quantity}`,
    });
  },
});

