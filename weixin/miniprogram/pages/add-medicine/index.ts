import Toast from "tdesign-miniprogram/toast/index";
import { getViewInfo } from "../../utils/view";

Component({
  data: {
    name: "",
    rule: "",
    isQuantifiable: true,
    doseText: "",
    totalAmountText: "",
    navigating: false,
    viewLabel: "本人",
    // 按钮是否可点：至少要填药品名称
    get canSubmit() {
      return false; // computed in methods
    },
  },
  pageLifetimes: {
    show() {
      const v = getViewInfo();
      this.setData({ viewLabel: v.isSelf ? "本人" : v.label });
    },
  },
  methods: {
    onNameChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ name: String(e.detail.value || "") });
    },
    onRuleChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ rule: String(e.detail.value || "") });
    },
    onQuantifiableChange(e: WechatMiniprogram.CustomEvent<{ value: string | number }>) {
      const v = String(e.detail.value || "1");
      const isQ = v === "1";
      this.setData({
        isQuantifiable: isQ,
        // 切换为不可量化时清空剂量文本
        doseText: isQ ? this.data.doseText : "每次适量",
        totalAmountText: isQ ? this.data.totalAmountText : "",
      });
    },
    onDoseTextChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ doseText: String(e.detail.value || "") });
    },
    onTotalAmountTextChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ totalAmountText: String(e.detail.value || "") });
    },
    goNext() {
      if (this.data.navigating) return;
      if (!this.data.name.trim()) {
        Toast({ context: this, message: "请先填写药品名称" });
        return;
      }
      this.setData({ navigating: true });

      // 组装查询参数
      const params: string[] = [
        "name=" + encodeURIComponent(this.data.name),
        "from=manual",
        "isQuantifiable=" + (this.data.isQuantifiable ? "1" : "0"),
      ];
      if (this.data.rule.trim()) {
        params.push("rule=" + encodeURIComponent(this.data.rule.trim()));
      }
      if (this.data.doseText.trim()) {
        params.push("doseText=" + encodeURIComponent(this.data.doseText.trim()));
      }
      if (this.data.isQuantifiable && this.data.totalAmountText.trim()) {
        params.push("totalAmountText=" + encodeURIComponent(this.data.totalAmountText.trim()));
      }

      wx.navigateTo({
        url: "/pages/reminder-setting/index?" + params.join("&"),
        complete: () => {
          setTimeout(() => this.setData({ navigating: false }), 400);
        },
      });
    },
  },
});
