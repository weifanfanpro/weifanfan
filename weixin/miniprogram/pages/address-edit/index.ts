import { getAddressList, saveAddress } from "../../api/address";

type ShippingAddress = {
  addressId: string;
  receiver: string;
  phone: string;
  region: string;
  detail: string;
  tag?: string;
  isDefault?: boolean;
};

function parseRegionParts(regionText: string): string[] {
  const parts = String(regionText || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 3) return [parts[0], parts[1], parts[2]];
  return [];
}

Page({
  data: {
    addressId: "",
    receiver: "",
    phone: "",
    region: "",
    regionParts: [] as string[],
    detail: "",
    tag: "家",
    isDefault: false,
    submitting: false,
  },
  async onLoad(query: Record<string, string>) {
    const addressId = String(query.addressId || "").trim();
    if (!addressId) return;
    this.setData({ addressId });
    try {
      const { list } = await getAddressList();
      const row = list.find((x) => x.addressId === addressId);
      if (!row) return;
      this.setData({
        receiver: String(row.receiver || ""),
        phone: String(row.phone || ""),
        region: String(row.region || ""),
        regionParts: parseRegionParts(String(row.region || "")),
        detail: String(row.detail || ""),
        tag: String(row.tag || ""),
        isDefault: !!row.isDefault,
      });
    } catch {}
  },
  onInputReceiver(e: WechatMiniprogram.Input) {
    this.setData({ receiver: String(e.detail.value || "") });
  },
  onInputPhone(e: WechatMiniprogram.Input) {
    this.setData({ phone: String(e.detail.value || "") });
  },
  onRegionPickerChange(e: WechatMiniprogram.CustomEvent<{ value: string[] }>) {
    const parts = Array.isArray(e.detail?.value) ? e.detail.value : [];
    const clean = parts.map((x) => String(x || "").trim()).filter(Boolean);
    this.setData({
      regionParts: clean,
      region: clean.join(" "),
    });
  },
  onInputDetail(e: WechatMiniprogram.Input) {
    this.setData({ detail: String(e.detail.value || "") });
  },
  onInputTag(e: WechatMiniprogram.Input) {
    this.setData({ tag: String(e.detail.value || "").slice(0, 8) });
  },
  onSwitchDefault(e: WechatMiniprogram.CustomEvent<{ value: boolean }>) {
    this.setData({ isDefault: !!e.detail.value });
  },
  async onSubmit() {
    if (this.data.submitting) return;
    const receiver = String(this.data.receiver || "").trim();
    const phone = String(this.data.phone || "").trim();
    const region = String((this.data.regionParts || []).join(" ") || this.data.region || "").trim();
    const detail = String(this.data.detail || "").trim();
    const tag = String(this.data.tag || "").trim();
    if (!receiver) return wx.showToast({ icon: "none", title: "请填写收件人" });
    if (!/^\d{11}$/.test(phone)) return wx.showToast({ icon: "none", title: "请填写正确手机号" });
    if (!region) return wx.showToast({ icon: "none", title: "请填写地区" });
    if (!detail) return wx.showToast({ icon: "none", title: "请填写详细地址" });

    this.setData({ submitting: true });
    try {
      await saveAddress({
        addressId: String(this.data.addressId || ""),
        receiver,
        phone,
        region,
        detail,
        tag,
        isDefault: !!this.data.isDefault,
      });
      wx.showToast({ icon: "success", title: "已保存" });
      setTimeout(() => wx.navigateBack(), 260);
    } catch (e: any) {
      wx.showToast({ icon: "none", title: (e?.message || "保存失败").slice(0, 8) });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
