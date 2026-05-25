import Toast from "tdesign-miniprogram/toast/index";
import { isAuthed } from "../../utils/user";
import { post } from "../../utils/request";

Page({
  data: {
    feedback: "",
  },
  onChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ feedback: String(e.detail.value || "") });
  },
  async onSubmit() {
    if (!isAuthed()) {
      Toast({ context: this, message: "请先登录再提交反馈" });
      return;
    }
    const msg = String(this.data.feedback || "").trim();
    if (!msg) {
      Toast({ context: this, message: "请先填写反馈内容" });
      return;
    }
    try {
      await post("/api/feedback", { content: msg });
      Toast({ context: this, message: "反馈已提交，感谢你的建议" });
      this.setData({ feedback: "" });
    } catch (e: any) {
      Toast({ context: this, message: e?.message || "提交失败" });
    }
  },
});

