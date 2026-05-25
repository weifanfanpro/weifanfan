import { getOpenId } from "./user";

const VIEW_KEY = "current_view_openid";
const VIEW_LABEL_KEY = "current_view_label";

export type ViewInfo = {
  viewOpenid: string;
  label: string;
  isSelf: boolean;
};

export function getViewInfo(): ViewInfo {
  const self = getOpenId();
  const viewOpenid = String(wx.getStorageSync(VIEW_KEY) || "") || self;
  const label = String(wx.getStorageSync(VIEW_LABEL_KEY) || "") || (viewOpenid === self ? "我自己" : "家人");
  return { viewOpenid, label, isSelf: viewOpenid === self };
}

export function setViewInfo(viewOpenid: string, label: string) {
  wx.setStorageSync(VIEW_KEY, viewOpenid);
  wx.setStorageSync(VIEW_LABEL_KEY, label || "家人");
}

export function resetViewToSelf() {
  const self = getOpenId();
  setViewInfo(self, "我自己");
}

