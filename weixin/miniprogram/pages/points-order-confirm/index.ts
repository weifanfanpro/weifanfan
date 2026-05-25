import { getWallet } from "../../api/points";
import { getProducts, createOrder } from "../../api/mall";
import { getAddressList } from "../../api/address";

type Product = {
  productId: string;
  name: string;
  desc: string;
  cover: string;
  pointsPrice: number;
  stockMock: number;
  category: string;
};

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
    product: null as Product | null,
    quantity: 1,
    pointsBalance: 0,
    pointsCost: 0,
    pointsAfterPay: 0,
    pointsGap: 0,
    selectedAddress: null as ShippingAddress | null,
    selectedAddressId: "",
    submitting: false,
    loadingAddress: true,
    canSubmit: false,
    submitHint: "请先选择收货地址",
  },
  async onLoad(query: Record<string, string>) {
    const productId = String(query.productId || "");
    const quantity = Math.max(1, Number(query.quantity || 1) || 1);
    this.setData({ quantity });
    await Promise.all([this.loadBase(productId, quantity), this.loadAddress()]);
  },
  async onShow() {
    await this.loadAddress();
  },
  async loadBase(productId: string, quantity: number) {
    try {
      const [wallet, products] = await Promise.all([getWallet(), getProducts()]);
      const product = products.find((p) => p.productId === productId) || null;
      const pointsCost = Number(product?.pointsPrice || 0) * quantity;
      const pointsBalance = wallet.pointsBalance;
      this.setData({
        product,
        pointsBalance,
        pointsCost,
        pointsAfterPay: Math.max(0, pointsBalance - pointsCost),
        pointsGap: Math.max(0, pointsCost - pointsBalance),
      });
      this.syncSubmitState();
    } catch {
      wx.showToast({ icon: "none", title: "加载失败" });
    }
  },
  async loadAddress() {
    this.setData({ loadingAddress: true });
    try {
      const selectedIdFromCache = String(wx.getStorageSync(SELECTED_ADDR_KEY) || "").trim();
      const { list, defaultAddress } = await getAddressList();
      let selected = list.find((x) => x.addressId === selectedIdFromCache) || null;
      if (!selected) selected = defaultAddress;
      this.setData({
        selectedAddress: selected,
        selectedAddressId: String(selected?.addressId || ""),
      });
      this.syncSubmitState();
    } catch {
      this.setData({ selectedAddress: null, selectedAddressId: "" });
      this.syncSubmitState();
    } finally {
      this.setData({ loadingAddress: false });
    }
  },
  syncSubmitState() {
    const hasAddress = !!String(this.data.selectedAddressId || "").trim();
    const enoughPoints = Number(this.data.pointsGap || 0) <= 0;
    const canSubmit = hasAddress && enoughPoints;
    let submitHint = "地址与积分确认无误后提交";
    if (!hasAddress) submitHint = "请先选择收货地址";
    else if (!enoughPoints) submitHint = `积分不足，还差 ${this.data.pointsGap} 积分`;
    this.setData({ canSubmit, submitHint });
  },
  onOpenAddressManage() {
    const selectedAddressId = encodeURIComponent(String(this.data.selectedAddressId || ""));
    wx.navigateTo({ url: `/pages/address-list/index?mode=choose&selectedAddressId=${selectedAddressId}` });
  },
  async onSubmit() {
    if (this.data.submitting || !this.data.product) return;
    if (!this.data.canSubmit) return;
    if (this.data.pointsBalance < this.data.pointsCost) {
      wx.showToast({ icon: "none", title: "积分不足，请先去赚积分" });
      return;
    }
    if (!this.data.selectedAddressId) {
      wx.showToast({ icon: "none", title: "请先选择收货地址" });
      return;
    }

    this.setData({ submitting: true });
    try {
      const { orderId } = await createOrder({
        productId: this.data.product.productId,
        quantity: this.data.quantity,
        addressId: this.data.selectedAddressId,
      });
      wx.navigateTo({ url: `/pages/points-order-pay/index?orderId=${encodeURIComponent(orderId)}` });
    } catch (e: any) {
      const msg = String(e?.message || e?.errMsg || "下单失败").trim();
      wx.showModal({
        title: "下单失败",
        content: msg.length > 400 ? msg.slice(0, 400) + "..." : msg,
        showCancel: false,
      });
    } finally {
      this.setData({ submitting: false });
    }
  },
});

