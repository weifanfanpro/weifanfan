import { searchMedicineLibrary, listMedicineLibrary } from "../../api/medicine-library";

type LibRow = {
  _id: string;
  medicineId?: string;
  name: string;
  dosageSummary?: string;
  indication?: string;
  ruleHint?: string;
  subtitle: string;
  /** 含 <em class="es-hl"> 的 HTML，用于 rich-text */
  titleHtml?: string;
  fragHtml?: string;
};

const PAGE_SIZE = 20;

// NOTE: usage/meal filters are not yet supported by the new HTTP API.
// They are preserved in the UI for future use but do not affect search results.
const USAGE_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "全部用药方式" },
  { value: "oral", label: "口服" },
  { value: "topical", label: "外用" },
  { value: "eye", label: "滴眼" },
  { value: "nose", label: "滴鼻" },
  { value: "inhalation", label: "吸入" },
  { value: "injection", label: "注射" },
  { value: "other", label: "其他" },
];

const MEAL_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "全部进食关系" },
  { value: "none", label: "未指定" },
  { value: "before", label: "饭前" },
  { value: "after", label: "饭后" },
  { value: "empty", label: "空腹" },
];

function buildSubtitle(doc: Record<string, unknown>): string {
  const a = String(doc.dosageSummary || "").trim();
  const b = String(doc.indication || "").trim();
  const c = String(doc.ruleHint || "").trim();
  if (a) return a.length > 80 ? a.slice(0, 80) + "…" : a;
  if (b) return b.length > 80 ? b.slice(0, 80) + "…" : b;
  if (c) return c.length > 80 ? c.slice(0, 80) + "…" : c;
  return "暂无用法摘要，可进入详情查看或补充";
}

function buildFragHtml(frags: string[]): string {
  if (!Array.isArray(frags) || !frags.length) return "";
  const inner = frags
    .slice(0, 3)
    .map((f) => `<div class="es-frag">${String(f)}</div>`)
    .join("");
  return `<div class="es-frags">${inner}</div>`;
}

function mapSearchRow(d: Record<string, unknown>): LibRow {
  const frags = (d.highlightFragments || []) as string[];
  const cloudFrag = String(d.fragHtml || "").trim();
  return {
    _id: String(d.id ?? d._id ?? ""),
    medicineId: String(d.medicineId || ""),
    name: String(d.name || "未命名药品"),
    dosageSummary: d.dosageSummary as string | undefined,
    indication: d.indication as string | undefined,
    ruleHint: d.ruleHint as string | undefined,
    subtitle: buildSubtitle(d),
    titleHtml: String(d.titleHtml || "").trim() || undefined,
    fragHtml: cloudFrag || buildFragHtml(frags) || undefined,
  };
}

Page({
  data: {
    list: [] as LibRow[],
    loading: true,
    hasMore: true,
    skip: 0,
    searchFrom: 0,
    keyword: "",
    filterUsageMethod: "",
    filterMeal: "",
    filterHasMedicineId: false,
    usageFilterOptions: USAGE_FILTER_OPTIONS,
    mealFilterOptions: MEAL_FILTER_OPTIONS,
    usageFilterIndex: 0,
    mealFilterIndex: 0,
    /** 用于空态：是否有搜索/筛选条件（与列表模式区分） */
    hasSearchCondition: false,
  },

  _kwTimer: null as ReturnType<typeof setTimeout> | null,

  onLoad() {
    void this.loadFirst();
  },

  onUnload() {
    if (this._kwTimer) clearTimeout(this._kwTimer);
  },

  onPullDownRefresh() {
    void this.loadFirst();
  },

  onReachBottom() {
    this.fetchPage(false);
  },

  isSearchMode(): boolean {
    const kw = String((this.data as any).keyword || "").trim();
    return (
      kw.length > 0 ||
      !!String((this.data as any).filterUsageMethod || "").trim() ||
      !!String((this.data as any).filterMeal || "").trim() ||
      Boolean((this.data as any).filterHasMedicineId)
    );
  },

  loadFirst() {
    this.setData({ skip: 0, searchFrom: 0, hasMore: true, list: [] });
    return this.fetchPage(true);
  },

  onKeywordInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    const v = String(e.detail.value || "");
    this.setData({ keyword: v });
    if (this._kwTimer) clearTimeout(this._kwTimer);
    this._kwTimer = setTimeout(() => {
      this._kwTimer = null;
      void this.loadFirst();
    }, 400);
  },

  onClearSearch() {
    if (this._kwTimer) clearTimeout(this._kwTimer);
    this.setData(
      {
        keyword: "",
        filterUsageMethod: "",
        filterMeal: "",
        filterHasMedicineId: false,
        usageFilterIndex: 0,
        mealFilterIndex: 0,
        hasSearchCondition: false,
      },
      () => void this.loadFirst(),
    );
  },

  onUsageFilterPicker(e: WechatMiniprogram.PickerChange) {
    const idx = Number(e.detail.value) || 0;
    const opt = USAGE_FILTER_OPTIONS[idx] || USAGE_FILTER_OPTIONS[0];
    this.setData({ usageFilterIndex: idx, filterUsageMethod: opt.value }, () => void this.loadFirst());
  },

  onMealFilterPicker(e: WechatMiniprogram.PickerChange) {
    const idx = Number(e.detail.value) || 0;
    const opt = MEAL_FILTER_OPTIONS[idx] || MEAL_FILTER_OPTIONS[0];
    this.setData({ mealFilterIndex: idx, filterMeal: opt.value }, () => void this.loadFirst());
  },

  onHasMedicineIdChange(e: WechatMiniprogram.CustomEvent<{ value: boolean }>) {
    this.setData({ filterHasMedicineId: Boolean(e.detail.value) }, () => void this.loadFirst());
  },

  async fetchPage(reset: boolean) {
    if (this.data.loading && !reset) return;
    if (!reset && !this.data.hasMore) return;

    this.setData({
      loading: true,
      hasSearchCondition: this.isSearchMode(),
    });
    const limit = PAGE_SIZE;

    try {
      if (this.isSearchMode()) {
        const skipSearch = reset ? 0 : this.data.searchFrom;
        const page = Math.floor(skipSearch / limit) + 1;
        const keyword = String(this.data.keyword || "").trim();

        const ret = (await searchMedicineLibrary(keyword, page, limit)) as {
          list?: unknown[];
          hasMore?: boolean;
        };
        const raw = (ret?.list || []) as Record<string, unknown>[];
        const mapped = raw.map(mapSearchRow);
        const nextList = reset ? mapped : this.data.list.concat(mapped);
        this.setData({
          list: nextList,
          searchFrom: skipSearch + mapped.length,
          hasMore: !!ret?.hasMore,
          loading: false,
        });
      } else {
        const skip = reset ? 0 : this.data.skip;
        const page = Math.floor(skip / limit) + 1;
        const ret = (await listMedicineLibrary(page, limit)) as {
          list?: unknown[];
          hasMore?: boolean;
        };
        const raw = (ret?.list || []) as Record<string, unknown>[];
        const mapped: LibRow[] = raw.map((d) => ({
          _id: String(d.id ?? d._id ?? ""),
          medicineId: String(d.medicineId || ""),
          name: String(d.name || "未命名药品"),
          dosageSummary: d.dosageSummary as string | undefined,
          indication: d.indication as string | undefined,
          ruleHint: d.ruleHint as string | undefined,
          subtitle: buildSubtitle(d),
        }));
        const nextList = reset ? mapped : this.data.list.concat(mapped);
        this.setData({
          list: nextList,
          skip: skip + mapped.length,
          hasMore: !!ret?.hasMore,
          loading: false,
        });
      }
    } catch (err) {
      console.error("medicine-library fetch", err);
      this.setData({ loading: false });
      const raw = err instanceof Error ? err.message : String(err);
      const msg = raw && raw.length <= 28 ? raw : "加载失败";
      wx.showToast({ icon: "none", title: msg });
    } finally {
      wx.stopPullDownRefresh();
    }
  },

  onOpen(e: WechatMiniprogram.BaseEvent) {
    const { name, id } = e.currentTarget.dataset as { name?: string; id?: string };
    const queryName = encodeURIComponent(name || "");
    const queryId = id ? "&id=" + encodeURIComponent(id) : "";
    wx.navigateTo({
      url: "/pages/drug-detail/index?name=" + queryName + queryId,
    });
  },
});
