import { getWallet } from "../../api/points";
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
    pointsBalance: 0,
    list: [] as Product[],
    loading: true,
    category: "全部",
    categories: ["全部"] as string[],
    filteredEmpty: false,
  },
  onShow() {
    this.loadAll();
  },
  async loadAll() {
    this.setData({ loading: true });
    try {
      try {
        const cached = Number(wx.getStorageSync("points_balance_cache"));
        if (Number.isFinite(cached)) {
          this.setData({ pointsBalance: Math.max(0, cached) });
        }
      } catch {}
      const [wallet, products] = await Promise.all([getWallet(), getProducts()]);
      const cats = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
      this.setData({
        pointsBalance: wallet.pointsBalance,
        list: products,
        categories: ["全部", ...cats],
      });
      try {
        wx.setStorageSync("points_balance_cache", wallet.pointsBalance);
      } catch {}
    } catch (e) {
      wx.showToast({ icon: "none", title: "加载失败" });
    } finally {
      this.setData({ loading: false });
    }
  },
  onTabCategory(e: WechatMiniprogram.BaseEvent) {
    const val = String((e.currentTarget as any)?.dataset?.value || "全部");
    const list = (this.data as any).list as Product[];
    const filteredEmpty = val !== "全部" && !list.some((p) => p.category === val);
    this.setData({ category: val, filteredEmpty });
  },
  onOpenOrderList() {
    wx.navigateTo({ url: "/pages/points-order-list/index" });
  },
  onOpenProduct(e: WechatMiniprogram.BaseEvent) {
    const id = String(e.currentTarget.dataset.id || "");
    if (!id) return;
    wx.navigateTo({ url: `/pages/points-product-detail/index?id=${encodeURIComponent(id)}` });
  },
});
