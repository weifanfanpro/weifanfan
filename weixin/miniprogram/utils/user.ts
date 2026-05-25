export type UserProfile = {
  openid?: string;
  nickName: string;
  avatarUrl: string;
  gender?: number;
};

const OPENID_KEY = "openid";
const PROFILE_KEY = "user_profile";

export function getOpenId(): string {
  return String(wx.getStorageSync(OPENID_KEY) || "");
}

export function setOpenId(openid: string) {
  wx.setStorageSync(OPENID_KEY, openid);
}

export function getUserProfile(): UserProfile | null {
  const raw = wx.getStorageSync(PROFILE_KEY);
  if (!raw) return null;
  return raw as UserProfile;
}

export function isAuthed(): boolean {
  const p = getUserProfile();
  return Boolean(p && p.nickName && p.avatarUrl);
}

export function setUserProfile(profile: UserProfile) {
  wx.setStorageSync(PROFILE_KEY, profile);
}

export function clearUserProfile() {
  wx.removeStorageSync(PROFILE_KEY);
}

