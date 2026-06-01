import { post } from "../../utils/request";

type Row = {
  key: string;
  name: string;
  address: string;
  desc: string;
  distText: string;
  latitude: number;
  longitude: number;
};

function formatDistance(m: number | null | undefined): string {
  if (m == null || Number.isNaN(m)) return "";
  if (m < 1000) return `约 ${Math.round(m)} m`;
  return `约 ${(m / 1000).toFixed(1)} km`;
}

Page({
  data: {
    heroTitle: "附近药店",
    heroSubtitle: "基于定位查询周边药店，结果仅供参考。",
    noticeText: "数据来自百度地图 POI，仅供参考；不表示药品经营资质认证。购药请到持《药品经营许可证》的正规门店，并遵医嘱。",
    locationText: "未定位",
    userLat: 0,
    userLng: 0,
    radiusM: 2000,
    list: [] as Row[],
    pageNum: 0,
    hasMore: true,
    searching: false,
    locating: false,
    hadSearch: false,
  },

  onLoad() {
    void this.bootstrap();
  },

  onPullDownRefresh() {
    void this.bootstrap();
  },

  onReachBottom() {
    void this.loadMore();
  },

  async bootstrap() {
    this.setData({ list: [], pageNum: 0, hasMore: true, hadSearch: false });
    const ok = await this.ensureLocation();
    wx.stopPullDownRefresh();
    if (ok) await this.fetchPage(0, true);
  },

  async onRefreshLocation() {
    this.setData({ list: [], pageNum: 0, hasMore: true });
    const ok = await this.ensureLocation();
    if (ok) await this.fetchPage(0, true);
  },

  async onSearchAgain() {
    if (!this.data.userLat || !this.data.userLng) {
      const ok = await this.ensureLocation();
      if (!ok) return;
    }
    this.setData({ list: [], pageNum: 0, hasMore: true });
    await this.fetchPage(0, true);
  },

  async loadMore() {
    if (!this.data.hasMore || this.data.searching) return;
    if (!this.data.userLat || !this.data.userLng) return;
    await this.fetchPage(this.data.pageNum + 1, false);
  },

  ensureLocation(): Promise<boolean> {
    this.setData({ locating: true });
    return new Promise((resolve) => {
      wx.getLocation({
        type: "gcj02",
        success: (res) => {
          this.setData({
            userLat: res.latitude,
            userLng: res.longitude,
            locating: false,
            locationText: `已定位 · 约 ${this.data.radiusM} 米内`,
          });
          resolve(true);
        },
        fail: () => {
          this.setData({ locating: false, locationText: "未定位" });
          wx.showModal({
            title: "需要位置权限",
            content: "查找附近药店需要获取你的位置。请在设置中开启定位权限。",
            confirmText: "去设置",
            cancelText: "取消",
            success: (r) => {
              if (r.confirm) wx.openSetting({});
            },
          });
          resolve(false);
        },
      });
    });
  },

  async fetchPage(pageNum: number, replace: boolean) {
    if (this.data.searching) return;
    const { userLat, userLng, radiusM } = this.data;
    if (!userLat || !userLng) return;

    this.setData({ searching: true });
    try {
      const ret = (await post(`/api/pharmacy/nearby?lat=${userLat}&lng=${userLng}&radius=${radiusM}`)) as Array<{
        name?: string;
        address?: string;
        phone?: string;
        distance?: number | null;
        lat?: number;
        lng?: number;
      }> | null;

      const raw = Array.isArray(ret) ? ret : [];
      const mapped: Row[] = raw.map((item, idx) => {
        const name = String(item.name || "药店");
        const address = String(item.address || "");
        const tel = String(item.phone || "").trim();
        const parts = [address, tel ? `电话 ${tel}` : ""].filter(Boolean);
        return {
          key: `${pageNum}-${idx}-${name}`,
          name,
          address,
          desc: parts.join(" · ") || "地址暂无",
          distText: formatDistance(item.distance ?? null),
          latitude: Number(item.lat),
          longitude: Number(item.lng),
        };
      });

      const nextList = replace ? mapped : this.data.list.concat(mapped);
      this.setData({
        list: nextList,
        pageNum,
        hasMore: mapped.length >= 20,
        searching: false,
        hadSearch: true,
        locationText: `已定位 · 约 ${radiusM} 米内`,
      });
    } catch (e) {
      console.error("nearbyPharmacy", e);
      this.setData({ searching: false, hadSearch: true });
      wx.showToast({ icon: "none", title: "网络异常，请稍后重试" });
    }
  },

  onOpenMap(e: WechatMiniprogram.BaseEvent) {
    const { lat, lng, name, address } = e.currentTarget.dataset as {
      lat?: string;
      lng?: string;
      name?: string;
      address?: string;
    };
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    wx.openLocation({
      latitude,
      longitude,
      name: name ? String(name) : "药店",
      address: address ? String(address) : "",
      scale: 16,
    });
  },
});
