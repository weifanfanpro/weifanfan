export type UserProfile = {
  openid?: string;
  nickName: string;
  avatarUrl: string;
  gender?: number;
};

const OPENID_KEY = "openid";
const PROFILE_KEY = "user_profile";

// 内存缓存，避免 storage 读写时序竞争
let _profileCache: UserProfile | null = null;

export function getOpenId(): string {
  return String(wx.getStorageSync(OPENID_KEY) || "");
}

export function setOpenId(openid: string) {
  wx.setStorageSync(OPENID_KEY, openid);
}

export function getUserProfile(): UserProfile | null {
  if (_profileCache) return _profileCache;
  const raw = wx.getStorageSync(PROFILE_KEY);
  if (!raw) return null;
  _profileCache = raw as UserProfile;
  return _profileCache;
}

export function isAuthed(): boolean {
  const p = getUserProfile();
  return Boolean(p && p.nickName && p.avatarUrl);
}

export function setUserProfile(profile: UserProfile) {
  _profileCache = profile;
  wx.setStorageSync(PROFILE_KEY, profile);
}

export function clearUserProfile() {
  _profileCache = null;
  wx.removeStorageSync(PROFILE_KEY);
}
