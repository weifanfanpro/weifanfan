/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo;
    /** 扫药结果页使用 */
    scanResult?: {
      result: {
        name: string;
        indication: string;
        dosage: string;
        warnings?: string[];
        contraindications?: string;
      };
      medicineId: string;
      viewIsSelf: boolean;
      viewLabel: string;
    } | null;
    /** 咨询页 onShow 消费后清空 */
    aiConsultMedicine?: {
      source: "scan" | "list" | "album";
      name: string;
      viewLabel?: string;
      /** 传给 AI 的可读字段（与药品详情页信息结构一致） */
      detail?: {
        usageDosage: string;
        indication: string;
        precautions: string;
        contraindications: string;
      };
      /** 扫描链路原始结果，仅用于生成 detail */
      result?: {
        name: string;
        indication: string;
        dosage: string;
        warnings?: string[];
        contraindications?: string;
      };
    } | null;
    /** 咨询药品详情页 onLoad 读取后清空 */
    consultMedicineDetailEntry?: {
      structured?: {
        source: "scan" | "list" | "album";
        name: string;
        viewLabel?: string;
        detail?: {
          usageDosage: string;
          indication: string;
          precautions: string;
          contraindications: string;
        };
        result?: {
          name: string;
          indication: string;
          dosage: string;
          warnings?: string[];
          contraindications?: string;
        };
      };
      rawBlock?: string;
    } | null;
  };
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback;
}