import Toast from "tdesign-miniprogram/toast/index";
import { plainAssistantDisplay } from "../../utils/chat-message-html";
import {
  getSessions,
  getSession,
  deleteSession,
  sendMessage,
  formatChatError,
} from "../../api/ai-chat";

/* ── Types ── */

type ChatMsg = {
  role: "user" | "assistant";
  content: string;
  displayContent?: string;
  consultAttach?: string;
  reasoning?: string;
};

type SessionRow = {
  sessionId: string;
  title: string;
  timeText: string;
};

type ConsultMedicine = NonNullable<IAppOption["globalData"]["aiConsultMedicine"]>;

/* ── Helpers ── */

function formatSessionTime(v: unknown): string {
  if (v == null) return "";
  let d: Date;
  if (v instanceof Date) {
    d = v;
  } else if (typeof v === "object" && v && typeof (v as { getTime?: () => number }).getTime === "function") {
    d = v as Date;
  } else {
    const t = new Date(v as string);
    d = Number.isNaN(t.getTime()) ? new Date() : t;
  }
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  if (sameDay) return `今天 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildConsultBlock(cm: ConsultMedicine): string {
  const head =
    cm.source === "scan"
      ? "【本次咨询关联药品（扫描识别）】"
      : cm.source === "album"
        ? "【本次咨询关联药品（上传图片识别）】"
        : "【本次咨询关联药品（来自药单）】";
  const d = cm.detail;
  const lines: string[] = [head, `药品名称：${cm.name || "未知"}`];
  if (d) {
    if (d.usageDosage) lines.push(`用法用量（最重要）：${d.usageDosage}`);
    if (d.indication) lines.push(`主治功能：${d.indication}`);
    if (d.precautions) lines.push(`注意事项：${d.precautions}`);
    if (d.contraindications) lines.push(`禁忌/慎用人群：${d.contraindications}`);
  } else if (cm.source === "scan" && cm.result) {
    const r = cm.result;
    if (r.dosage) lines.push(`用法用量（最重要）：${r.dosage}`);
    if (r.indication) lines.push(`主治功能：${r.indication}`);
    if (Array.isArray(r.warnings) && r.warnings.length) lines.push(`注意事项：${r.warnings.join("；")}`);
    if (r.contraindications) lines.push(`禁忌/慎用人群：${r.contraindications}`);
  }
  if (cm.viewLabel) lines.push(`当前咨询视角：${cm.viewLabel}`);
  return lines.join("\n");
}

/* ── Component ── */

Component({
  properties: {
    active: { type: Boolean, value: false },
  },

  observers: {
    active(active: boolean) {
      if (active) (this as any).onTabPanelShow?.();
    },
  },

  data: {
    // Navigation
    sessionTitle: "新对话",
    sessionId: "" as string,

    // Messages
    messages: [] as ChatMsg[],
    sending: false,
    inputValue: "",
    canSend: false,

    // Thinking / deep features
    deepThinking: false,
    webSearch: false,
    thinkingLabel: "" as string,
    toolStatusText: "" as string,

    // Scroll
    scrollTarget: "" as string,
    _scrollKey: 0,

    // Reasoning toggle
    reasoningOpen: {} as Record<string, boolean>,

    // Session drawer
    drawerOpen: false,
    sessions: [] as SessionRow[],
    sessionListLoading: false,
    delTargetId: "" as string,

    // Layout measurements
    toolbarH: 0,
    inputH: 0,

    // Consult medicine
    consultTitle: "" as string,
    consultBlock: "" as string,
    consultPayload: null as ConsultMedicine | null,
    sheetVisible: false,
  },

  lifetimes: {
    attached() {
      try {
        const win = wx.getWindowInfo();
        const menu = wx.getMenuButtonBoundingClientRect();
        const navBottom = menu.bottom || (win.statusBarHeight || 20) + 44;
        const safeBottom = win.safeAreaInsets?.bottom ?? 0;
        this.setData({ toolbarH: navBottom, inputH: safeBottom + 12 });
      } catch {
        this.setData({ toolbarH: 88, inputH: 50 });
      }
    },
  },

  pageLifetimes: {
    show() {
      if (!this.properties.active) return;
      (this as any).onTabPanelShow?.();
    },
  },

  methods: {
    /* ── Lifecycle ── */

    onTabPanelShow() {
      // Pick up consult medicine from globalData if set
      const app = getApp<IAppOption>();
      const raw = app.globalData?.aiConsultMedicine;
      if (raw && app.globalData) {
        app.globalData.aiConsultMedicine = null;
        this.applyConsultMedicine(raw);
      }
      // Restore send state
      const v = (this.data.inputValue || "").trim();
      if (v && !this.data.sending) this.setData({ canSend: true });
      // Measure layout for drawer
      setTimeout(() => {
        const q = wx.createSelectorQuery();
        q.select("#toolbar").boundingClientRect();
        q.select("#input-dock").boundingClientRect();
        q.exec((res) => {
          const tRect = res[0];
          const iRect = res[1];
          if (tRect && tRect.height) this.setData({ toolbarH: tRect.height });
          if (iRect && iRect.height) this.setData({ inputH: iRect.height });
        });
      }, 200);
    },

    /* ── Scroll ── */

    scrollToBottom(force = false) {
      setTimeout(() => {
        if (force) this.setData({ _scrollKey: Date.now() });
        this.setData({ scrollTarget: "chat-anchor" });
      }, 30);
    },

    /* ── Input ── */

    onInput(e: WechatMiniprogram.TextareaInput) {
      const v = e.detail.value || "";
      this.setData({ inputValue: v, canSend: !!v.trim() && !this.data.sending });
    },

    onSend() {
      const text = (this.data.inputValue || "").trim();
      if (!text || this.data.sending) return;

      const block = (this.data.consultBlock || "").trim();
      const userContent = block ? `${block}\n\n【我的问题】\n${text}` : text;

      // Build thinking label
      const parts: string[] = [];
      if (this.data.deepThinking) parts.push("深度思考");
      if (this.data.webSearch) parts.push("联网搜索");
      const statusLabel = parts.length > 0 ? `${parts.join(" · ")}中...` : "";

      const userMsg: ChatMsg = {
        role: "user",
        content: userContent,
        displayContent: text,
        ...(block ? { consultAttach: block } : {}),
      };

      this.setData({
        messages: [...this.data.messages, userMsg],
        inputValue: "",
        canSend: false,
        sending: true,
        sessionTitle:
          this.data.sessionTitle === "新对话"
            ? text.slice(0, 12) + (text.length > 12 ? "..." : "")
            : this.data.sessionTitle,
        thinkingLabel: statusLabel,
      });
      this.scrollToBottom();

      // Call API
      sendMessage({
        sessionId: this.data.sessionId || undefined,
        userContent,
        userDisplayContent: text,
        consultAttach: block || undefined,
        enableThinking: this.data.deepThinking,
        enableSearch: this.data.webSearch,
      })
        .then((res) => {
          const assistant = res.message;
          this.setData({
            sessionId: res.sessionId,
            sending: false,
            thinkingLabel: "",
            messages: [
              ...this.data.messages,
              {
                role: "assistant" as const,
                content: "",
                ...(assistant?.reasoning ? { reasoning: "" } : {}),
              },
            ],
          });
          this.scrollToBottom(true);
          this.typeWriter(assistant?.content || "", assistant?.reasoning || "");
        })
        .catch((err) => {
          console.error(err);
          Toast({ context: this, selector: "#t-toast", message: formatChatError(err) });
          this.setData({
            messages: this.data.messages.slice(0, -1),
            canSend: !!this.data.inputValue.trim(),
            sending: false,
            thinkingLabel: "",
          });
        });
    },

    /* ── Typewriter effect ── */

    typeWriter(content: string, reasoning: string) {
      let ci = 0;
      let ri = 0;
      const cLen = content.length;
      const rLen = reasoning.length;

      const step = () => {
        const msgs = this.data.messages;
        const last = msgs[msgs.length - 1];
        if (!last || last.role !== "assistant") return;

        ci = Math.min(ci + 2, cLen);
        ri = Math.min(ri + 3, rLen);

        this.setData({
          sending: false,
          messages: [
            ...msgs.slice(0, -1),
            {
              ...last,
              content: content.slice(0, ci),
              ...(rLen ? { reasoning: reasoning.slice(0, ri) } : {}),
            },
          ],
        });
        this.scrollToBottom(true);

        if (ci < cLen || (rLen && ri < rLen)) {
          setTimeout(step, ci < cLen ? 18 : 30);
        } else {
          // Typing done — apply display formatting
          const doneMsgs = this.data.messages;
          const doneLast = doneMsgs[doneMsgs.length - 1];
          if (!doneLast || doneLast.role !== "assistant") {
            this.setData({ canSend: false });
            return;
          }
          this.setData({
            canSend: false,
            messages: [
              ...doneMsgs.slice(0, -1),
              {
                ...doneLast,
                content: plainAssistantDisplay(content),
                ...(rLen ? { reasoning: plainAssistantDisplay(reasoning) } : {}),
              },
            ],
          });
        }
      };

      step();
    },

    /* ── Deep thinking / web search toggles ── */

    toggleDeepThinking() {
      const deepThinking = !this.data.deepThinking;
      const webSearch = this.data.webSearch;
      this.setData({
        deepThinking,
        toolStatusText: this.buildToolStatus(deepThinking, webSearch),
      });
    },

    toggleWebSearch() {
      const webSearch = !this.data.webSearch;
      const deepThinking = this.data.deepThinking;
      this.setData({
        webSearch,
        toolStatusText: this.buildToolStatus(deepThinking, webSearch),
      });
    },

    buildToolStatus(dt: boolean, ws: boolean): string {
      if (!dt && !ws) return "";
      const parts: string[] = [];
      if (dt) parts.push("深度思考");
      if (ws) parts.push("联网搜索");
      return `${parts.join(" . ")}已开启`;
    },

    /* ── Reasoning toggle ── */

    onToggleReasoning(e: WechatMiniprogram.TouchEvent) {
      const idx = String(e.currentTarget.dataset.index ?? "");
      const map = { ...this.data.reasoningOpen };
      map[idx] = !map[idx];
      this.setData({ reasoningOpen: map });
    },

    /* ── Session drawer ── */

    async onOpenDrawer() {
      this.setData({ drawerOpen: true, sessionListLoading: true });
      try {
        const list = await getSessions();
        const sessions: SessionRow[] = list.map((it) => ({
          sessionId: it.sessionId,
          title: it.title || "新对话",
          timeText: formatSessionTime(it.updatedAt),
        }));
        this.setData({ sessions, sessionListLoading: false });
      } catch (err) {
        console.error(err);
        Toast({ context: this, selector: "#t-toast", message: "加载历史失败" });
        this.setData({ sessionListLoading: false });
      }
    },

    onCloseDrawer() {
      this.setData({ drawerOpen: false, delTargetId: "" });
    },

    onNewChat() {
      this.setData({
        sessionId: "",
        messages: [],
        sessionTitle: "新对话",
        inputValue: "",
        canSend: false,
        reasoningOpen: {},
        thinkingLabel: "",
        consultTitle: "",
        consultBlock: "",
        consultPayload: null,
        sheetVisible: false,
        toolStatusText: "",
        delTargetId: "",
      });
    },

    async onPickSession(e: WechatMiniprogram.TouchEvent) {
      // 如果有删除目标，忽略这次 tap（说明刚长按过）
      if (this.data.delTargetId) return;
      const id = String(e.currentTarget.dataset.id || "");
      if (!id) return;
      wx.showLoading({ title: "加载中", mask: true });
      try {
        const session = await getSession(id);
        wx.hideLoading();
        const messages = (session.messages || []).map((m) => {
          const msg: ChatMsg = {
            role: m.role as "user" | "assistant",
            content: m.content || "",
            ...(m.displayContent ? { displayContent: m.displayContent } : {}),
            ...(m.consultAttach ? { consultAttach: m.consultAttach } : {}),
            ...(m.reasoning ? { reasoning: m.reasoning } : {}),
          };
          if (msg.role === "assistant") {
            msg.content = plainAssistantDisplay(msg.content);
            if (msg.reasoning) msg.reasoning = plainAssistantDisplay(msg.reasoning);
          }
          return msg;
        });
        this.setData({
          sessionId: session.sessionId,
          sessionTitle: session.title || "对话",
          messages,
          drawerOpen: false,
          delTargetId: "",
          reasoningOpen: {},
        });
        this.scrollToBottom();
      } catch (err) {
        wx.hideLoading();
        console.error(err);
        Toast({ context: this, selector: "#t-toast", message: "加载会话失败" });
      }
    },

    onLongPressSession(e: WechatMiniprogram.TouchEvent) {
      const id = String(e.currentTarget.dataset.id || "");
      if (!id) return;
      this.setData({ delTargetId: id });
    },

    onDeleteSession(e: WechatMiniprogram.TouchEvent) {
      const id = String(e.currentTarget.dataset.id || "");
      if (!id) return;
      this.setData({ delTargetId: "" });
      wx.showModal({
        title: "删除对话",
        content: "确定删除这条历史记录吗？",
        success: async (res) => {
          if (!res.confirm) return;
          try {
            await deleteSession(id);
            const sessions = this.data.sessions.filter((s) => s.sessionId !== id);
            this.setData({ sessions });
            if (this.data.sessionId === id) this.onNewChat();
          } catch (err) {
            console.error(err);
            Toast({ context: this, selector: "#t-toast", message: "删除失败" });
          }
        },
      });
    },

    /* ── Quick question ── */

    onQuickQuestion(e: WechatMiniprogram.TouchEvent) {
      const q = String(e.currentTarget.dataset.q || "");
      if (!q) return;
      this.setData({ inputValue: q, canSend: true });
      // Trigger send after a tick so the textarea value updates
      setTimeout(() => this.onSend(), 50);
    },

    /* ── Consult medicine ── */

    onOpenMedicineSheet() {
      this.setData({ sheetVisible: true });
    },

    onCloseSheet() {
      this.setData({ sheetVisible: false });
    },

    onSheetScan() {
      this.setData({ sheetVisible: false });
      wx.navigateTo({ url: "/pages/ai-chat-scan-medicine/index" });
    },

    onSheetPickList() {
      this.setData({ sheetVisible: false });
      wx.navigateTo({ url: "/pages/ai-chat-pick-medicine/index" });
    },

    applyConsultMedicine(raw: ConsultMedicine) {
      const block = buildConsultBlock(raw);
      const title = raw.name ? `${raw.name}` : "已选药品";
      this.setData({ consultBlock: block, consultTitle: title, consultPayload: raw });
      Toast({ context: this, selector: "#t-toast", message: "已关联药品，输入问题后发送即可" });
    },

    onClearConsult() {
      this.setData({ consultTitle: "", consultBlock: "", consultPayload: null });
    },

    onOpenConsultDetail() {
      const app = getApp<IAppOption>();
      if (!app.globalData) return;
      const payload = this.data.consultPayload;
      const block = (this.data.consultBlock || "").trim();
      if (payload) {
        app.globalData.consultMedicineDetailEntry = { structured: payload };
      } else if (block) {
        app.globalData.consultMedicineDetailEntry = { rawBlock: block };
      } else {
        return;
      }
      wx.navigateTo({ url: "/pages/ai-chat-consult-medicine-detail/index" });
    },

    onOpenMsgConsultDetail(e: WechatMiniprogram.TouchEvent) {
      const idx = Number(e.currentTarget.dataset.index);
      const m = this.data.messages[idx] as ChatMsg | undefined;
      const t = (m?.consultAttach || "").trim();
      if (!t) return;
      const app = getApp<IAppOption>();
      if (!app.globalData) return;
      app.globalData.consultMedicineDetailEntry = { rawBlock: t };
      wx.navigateTo({ url: "/pages/ai-chat-consult-medicine-detail/index" });
    },
  },
});
