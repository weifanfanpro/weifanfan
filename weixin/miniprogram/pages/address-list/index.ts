import { getAddressList, deleteAddress, setDefaultAddress } from "../../api/address";

type ShippingAddress = {
  addressId: string;
  receiver: string;
  phone: string;
  region: string;
  detail: string;
  tag?: string;
  isDefault?: boolean;
};

const SELECTED_ADDR_KEY = "mall_selected_address_id";

Page({
  data: {
    list: [] as ShippingAddress[],
    mode: "manage",
    selectedAddressId: "",
    loading: true,
  },
  onLoad(query: Record<string, string>) {
    this.setData({
      mode: String(query.mode || "manage"),
      selectedAddressId: String(query.selectedAddressId || ""),
    });
  },
  onShow() {
    this.loadList();
  },
  async loadList() {
    this.setData({ loading: true });
    try {
      const { list } = await getAddressList();
      this.setData({ list });
    } catch {
      wx.showToast({ icon: "none", title: "地址加载失败" });
    } finally {
      this.setData({ loading: false });
    }
  },
  onChooseAddress(e: WechatMiniprogram.BaseEvent) {
    if (this.data.mode !== "choose") return;
    const addressId = String(e.currentTarget.dataset.id || "").trim();
    if (!addressId) return;
    wx.setStorageSync(SELECTED_ADDR_KEY, addressId);
    wx.navigateBack();
  },
  onAddAddress() {
    wx.navigateTo({ url: "/pages/address-edit/index" });
  },
  onEditAddress(e: WechatMiniprogram.BaseEvent) {
    const addressId = String(e.currentTarget.dataset.id || "").trim();
    if (!addressId) return;
    wx.navigateTo({ url: `/pages/address-edit/index?addressId=${encodeURIComponent(addressId)}` });
  },
  async onSetDefault(e: WechatMiniprogram.BaseEvent) {
    const addressId = String(e.currentTarget.dataset.id || "").trim();
    if (!addressId) return;
    try {
      wx.showLoading({ title: "设置中..." });
      await setDefaultAddress(addressId);
      this.loadList();
    } catch (e: any) {
      wx.showToast({ icon: "none", title: (e?.message || "设置失败").slice(0, 8) });
    } finally {
      wx.hideLoading();
    }
  },
  async onDeleteAddress(e: WechatMiniprogram.BaseEvent) {
    const addressId = String(e.currentTarget.dataset.id || "").trim();
    if (!addressId) return;
    wx.showModal({
      title: "删除地址",
      content: "确认删除该收货地址吗？",
      success: async (r) => {
        if (!r.confirm) return;
        try {
          wx.showLoading({ title: "删除中..." });
          await deleteAddress(addressId);
          if (String(wx.getStorageSync(SELECTED_ADDR_KEY) || "") === addressId) {
            wx.removeStorageSync(SELECTED_ADDR_KEY);
          }
          this.loadList();
        } catch (e: any) {
          wx.showToast({ icon: "none", title: (e?.message || "删除失败").slice(0, 8) });
        } finally {
          wx.hideLoading();
        }
      },
    });
  },
});
