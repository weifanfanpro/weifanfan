type Point = { x: number; y: number };

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function pickPhase(p: number) {
  if (p < 0.18) return { stepIndex: 0, title: "物流运输", sub: "订单信息已同步，等待揽收", phase: "已创建" };
  if (p < 0.42) return { stepIndex: 1, title: "物流运输", sub: "快递员已揽收，正在装车发往分拨中心", phase: "揽收" };
  if (p < 0.82) return { stepIndex: 2, title: "物流运输", sub: "包裹运输中，预计当天或次日送达", phase: "运输中" };
  return { stepIndex: 3, title: "物流运输", sub: "包裹已签收", phase: "签收" };
}

function buildWaybill(seed: string) {
  const s = (seed || "MOCK").replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MO${s || "TEST"}${rand}`;
}

Page({
  data: {
    statusTitle: "物流运输",
    statusSub: "正在加载中…",
    etaText: "预计 1~2 天送达",
    hintText: "请留意派件电话，签收前请核对包裹信息",
    stepIndex: 0,
    mockWaybill: "",
    courierName: "中通快递",
    startCity: "重庆",
    endCity: "成都",
    truckX: 16,
    truckY: 62,
    progressText: "0%",
    phaseText: "已创建",
    tips: ["订单已创建，等待揽收", "包裹已发往分拨中心", "运输中，预计 1~2 天送达"],
  },
  onUnload() {
    const that = this as any;
    if (that._animTimer) clearInterval(that._animTimer);
    that._animTimer = null;
  },
  onHide() {
    const that = this as any;
    if (that._animTimer) clearInterval(that._animTimer);
    that._animTimer = null;
  },
  async onLoad(query: Record<string, string>) {
    const seed = String(query.orderId || "").trim();
    this.setData({ mockWaybill: buildWaybill(seed) });
    (this as any).startMockAnim?.();
  },
  startMockAnim() {
    const that = this as any;
    if (that._animTimer) return;

    // 路线关键点（百分比坐标），模拟一条“跨城路线”
    const path: Point[] = [
      { x: 16, y: 62 },
      { x: 34, y: 52 },
      { x: 56, y: 44 },
      { x: 78, y: 36 },
      { x: 86, y: 28 },
    ];

    const startAt = Date.now();
    const durationMs = 22000; // 一圈时长

    const tick = () => {
      const t = ((Date.now() - startAt) % durationMs) / durationMs;
      const p = clamp01(t);
      const phase = pickPhase(p);

      const segCount = path.length - 1;
      const segFloat = p * segCount;
      const segIdx = Math.min(segCount - 1, Math.max(0, Math.floor(segFloat)));
      const localT = segFloat - segIdx;
      const a = path[segIdx];
      const b = path[segIdx + 1];
      const x = lerp(a.x, b.x, localT);
      const y = lerp(a.y, b.y, localT);

      this.setData({
        truckX: Number(x.toFixed(2)),
        truckY: Number(y.toFixed(2)),
        progressText: `${Math.round(p * 100)}%`,
        phaseText: phase.phase,
        stepIndex: phase.stepIndex,
        statusTitle: phase.title,
        statusSub: phase.sub,
        etaText: phase.stepIndex >= 3 ? "已签收" : "预计 1~2 天送达",
        hintText: phase.stepIndex >= 3 ? "如有疑问可联系快递员或查看站内消息" : "请留意派件电话，签收前请核对包裹信息",
      });
    };

    tick();
    that._animTimer = setInterval(tick, 120);
  },

  onBackHome() {
    // 回到 TabShell 首页（tab=0）
    wx.reLaunch({ url: "/pages/tab-shell/index?tab=0" });
  },
});

