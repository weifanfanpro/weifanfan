import config from "../config";

const BASE_URL = config.baseUrl;

interface RequestOptions {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: any;
  header?: Record<string, string>;
  timeout?: number;
}

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

function getToken(): string {
  return wx.getStorageSync("token") || "";
}

function handleAuthFailure() {
  wx.removeStorageSync("token");
  wx.removeStorageSync("openid");
  const pages = getCurrentPages();
  const current = pages[pages.length - 1] as any;
  const route = current?.route ? `/${current.route}` : "/pages/tab-shell/index";
  if (route !== "/pages/login/index") {
    wx.reLaunch({
      url: `/pages/login/index?redirect=${encodeURIComponent(route)}`,
    });
  }
}

export function request<T = any>(options: RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const header: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.header,
    };
    if (token) {
      header["Authorization"] = `Bearer ${token}`;
    }

    wx.request({
      url: BASE_URL + options.url,
      method: options.method || "GET",
      data: options.data,
      header,
      timeout: options.timeout || 20000,
      success(res) {
        const data = res.data as ApiResponse<T>;
        if (res.statusCode === 401) {
          handleAuthFailure();
          reject(new Error("登录已过期，请重新登录"));
          return;
        }
        if (data.code !== 0) {
          reject(new Error(data.message || "请求失败"));
          return;
        }
        resolve(data.data);
      },
      fail(err) {
        wx.showToast({ title: "网络错误", icon: "none" });
        reject(err);
      },
    });
  });
}

export function upload<T = any>(url: string, filePath: string, name = "file"): Promise<T> {
  return new Promise((resolve, reject) => {
    const token = getToken();
    wx.uploadFile({
      url: BASE_URL + url,
      filePath,
      name,
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success(res) {
        try {
          const data = JSON.parse(res.data) as ApiResponse<T>;
          if (data.code !== 0) {
            wx.showToast({ title: data.message || "上传失败", icon: "none" });
            reject(new Error(data.message || "上传失败"));
            return;
          }
          resolve(data.data);
        } catch {
          reject(new Error("解析响应失败"));
        }
      },
      fail(err) {
        wx.showToast({ title: "上传失败", icon: "none" });
        reject(err);
      },
    });
  });
}

export function get<T = any>(url: string, timeout?: number): Promise<T> {
  return request<T>({ url, method: "GET", timeout });
}

export function post<T = any>(url: string, data?: any, timeout?: number): Promise<T> {
  return request<T>({ url, method: "POST", data, timeout });
}

export function put<T = any>(url: string, data?: any): Promise<T> {
  return request<T>({ url, method: "PUT", data });
}

export function del<T = any>(url: string): Promise<T> {
  return request<T>({ url, method: "DELETE" });
}
