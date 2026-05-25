import { switchMainTab } from "../utils/main-tab";

type TabItem = {
  value: number;
  url: string;
  defaultIcon: string;
  activeIcon: string;
};

Component({
  data: {
    value: 0,
    list: [
      { value: 0, url: "/pages/index/index", defaultIcon: "/assets/icons/home-default.png", activeIcon: "/assets/icons/home-active.png" },
      { value: 1, url: "/pages/scan/index", defaultIcon: "/assets/icons/scan-default.png", activeIcon: "/assets/icons/scan-active.png" },
      { value: 2, url: "/pages/ai-chat/index", defaultIcon: "/assets/icons/ai-default.png", activeIcon: "/assets/icons/ai-active.png" },
      { value: 3, url: "/pages/mine/index", defaultIcon: "/assets/icons/user-default.png", activeIcon: "/assets/icons/user-active.png" },
    ] as TabItem[],
  },
  methods: {
    /** 与当前选中一致时不再 setData，避免 TDesign tab-bar 反复触发 change → 切 Tab → 死循环 */
    setSelected(value: number) {
      if (this.data.value === value) return;
      this.setData({ value });
    },
    onChange(e: WechatMiniprogram.CustomEvent<{ value: number | string }>) {
      const nextValue = Number(e.detail.value);
      if (Number.isNaN(nextValue)) return;
      if (this.data.value === nextValue) return;
      const target = this.data.list.find((i) => i.value === nextValue);
      if (!target) return;

      this.setData({ value: nextValue });
      switchMainTab(nextValue);
    },
    // 获取当前 Tab 图标（根据是否选中返回对应图片）
    getIcon(item: TabItem, currentValue: number): string {
      return item.value === currentValue ? item.activeIcon : item.defaultIcon;
    },
  },
});