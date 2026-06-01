import {
  buildVmFromConsultMedicine,
  parseConsultBlockToVm,
  type ConsultDetailVm,
} from "../../utils/consult-medicine-detail";

const emptyDrug: ConsultDetailVm = {
  name: "药品",
  tagTimes: "—",
  tagDose: "—",
  tagWhen: "—",
  usageFull: "",
  indication: "",
  precautions: "",
  precautionsLines: [],
  contraindications: "",
  viewLabel: "",
};

Page({
  data: {
    opened: "dose" as string,
    drug: emptyDrug,
  },

  onLoad() {
    const app = getApp<IAppOption>();
    const entry = app.globalData?.consultMedicineDetailEntry;
    if (app.globalData) app.globalData.consultMedicineDetailEntry = null;

    let vm: ConsultDetailVm | null = null;
    if (entry?.structured) {
      vm = buildVmFromConsultMedicine(entry.structured);
    } else if (entry?.rawBlock) {
      vm = parseConsultBlockToVm(entry.rawBlock);
    }

    if (!vm) {
      wx.showToast({ icon: "none", title: "暂无药品信息" });
      setTimeout(() => wx.navigateBack(), 400);
      return;
    }

    this.setData({ drug: vm, opened: "dose" });
  },

  onTogglePanel(e: WechatMiniprogram.BaseEvent) {
    const val = String((e.currentTarget as any)?.dataset?.value || "");
    this.setData({ opened: this.data.opened === val ? "" : val });
  },
});
