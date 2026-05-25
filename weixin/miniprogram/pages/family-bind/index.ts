import Toast from "tdesign-miniprogram/toast/index";
import { getOpenId } from "../../utils/user";
import { getViewInfo, resetViewToSelf, setViewInfo } from "../../utils/view";
import { getRelations, bindFamily, unbind } from "../../api/family";

type Brief = { openid: string; nickName: string; avatarUrl: string };
type AsMemberItem = { id: string; ownerOpenid: string; owner: Brief };
type AsOwnerItem = { id: string; memberOpenid: string; member: Brief };

function pickCode(text: string): string {
  const s = String(text || "").trim();
  // 支持直接粘贴 openid，或二维码里带 family://bind?code=xxx
  const m = s.match(/code=([a-zA-Z0-9_-]+)/);
  if (m && m[1]) return m[1];
  return s;
}

Component({
  data: {
    heroTitle: "家人账号绑定",
    heroSubtitle: "绑定后可切换视角，帮家人管理药品与提醒。",
    tab: "care",
    selfOpenid: "",
    viewOpenid: "",
    viewLabel: "我自己",
    asMember: [] as AsMemberItem[],
    asOwner: [] as AsOwnerItem[],
  },
  lifetimes: {
    attached() {
      const selfOpenid = getOpenId();
      const v = getViewInfo();
      this.setData({ selfOpenid, viewOpenid: v.viewOpenid, viewLabel: v.label });
      (this as any).refresh?.();
    },
  },
  methods: {
    async refresh() {
      try {
        const relations = await getRelations();
        const selfOpenid = (this.data as any).selfOpenid as string;
        const list = Array.isArray(relations) ? relations : [];
        const asMember = list.filter((r: any) => r.memberOpenid === selfOpenid || r.role === "member");
        const asOwner = list.filter((r: any) => r.ownerOpenid === selfOpenid || r.role === "owner");
        this.setData({ asMember, asOwner });
      } catch (e) {
        console.error("family-bind refresh error", e);
        Toast({ context: this, message: "加载失败，请稍后重试" });
      }
    },
    onTabChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ tab: e.detail.value });
    },
    onCopyCode() {
      const code = String((this.data as any).selfOpenid || "");
      if (!code) return;
      wx.setClipboardData({
        data: code,
        success: () => Toast({ context: this, message: "已复制绑定码" }),
      });
    },
    onShowBindQr() {
      wx.navigateTo({ url: "/pages/family-qrcode/index" });
    },
    async bindWithCode(raw: string) {
      const code = pickCode(raw);
      if (!code) {
        Toast({ context: this, message: "绑定码不能为空" });
        return;
      }
      if (code === (this.data as any).selfOpenid) {
        Toast({ context: this, message: "不能绑定自己" });
        return;
      }
      try {
        // 当前用户是照护者(member)，绑定码所属用户是被照护者(owner)
        await bindFamily(code);
        Toast({ context: this, message: "绑定成功" });
        await (this as any).refresh?.();
      } catch (e) {
        console.error("bindWithCode error", e);
        const msg = String((e as any)?.message || (e as any)?.errMsg || "");
        Toast({ context: this, message: msg ? `绑定失败：${msg}` : "绑定失败，请检查绑定码" });
      }
    },
    onScanBind() {
      wx.scanCode({
        onlyFromCamera: false,
        success: async (r) => {
          const text = (r && (r.result || r.path || "")) as string;
          await (this as any).bindWithCode?.(text);
        },
        fail: () => Toast({ context: this, message: "你取消了扫码" }),
      });
    },
    onInputBind() {
      wx.showModal({
        title: "输入绑定码",
        editable: true,
        placeholderText: "粘贴对方绑定码（openid）",
        success: async (r) => {
          if (!r.confirm) return;
          await (this as any).bindWithCode?.(String((r as any).content || ""));
        },
      });
    },
    onSwitchView(e: WechatMiniprogram.BaseEvent) {
      const { openid, label } = e.currentTarget.dataset as { openid?: string; label?: string };
      if (!openid) return;
      setViewInfo(String(openid), String(label || "家人"));
      const v = getViewInfo();
      this.setData({ viewOpenid: v.viewOpenid, viewLabel: v.label });
      Toast({ context: this, message: `已切换为「${v.label}」视角` });
    },
    onResetToSelf() {
      const v = getViewInfo();
      if (v.isSelf) {
        return;
      }
      resetViewToSelf();
      const nv = getViewInfo();
      this.setData({ viewOpenid: nv.viewOpenid, viewLabel: nv.label });
      Toast({ context: this, message: "已切回「我自己」视角" });
    },
    onUnbind(e: WechatMiniprogram.BaseEvent) {
      const { id } = e.currentTarget.dataset as { id?: string };
      if (!id) return;
      wx.showModal({
        title: "确认解绑？",
        content: "解绑后对方将无法继续管理你的用药计划。",
        success: async (r) => {
          if (!r.confirm) return;
          try {
            await unbind(Number(id));
            Toast({ context: this, message: "已解绑" });
            // 如果解绑后当前视角刚好是被解绑对象，回到自己
            const v = getViewInfo();
            const stillExists = ((this.data as any).asMember || []).some((x: any) => String(x.id) === String(id));
            if (!stillExists && !v.isSelf) {
              resetViewToSelf();
              const nv = getViewInfo();
              this.setData({ viewOpenid: nv.viewOpenid, viewLabel: nv.label });
            }
            await (this as any).refresh?.();
          } catch (e) {
            console.error("unbind error", e);
            Toast({ context: this, message: "解绑失败" });
          }
        },
      });
    },
  },
});

