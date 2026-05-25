/** 主界面四 Tab 已迁入 pages/tab-shell，统一用壳页 + Swiper，不再使用 wx.switchTab */

const SHELL = "/pages/tab-shell/index";

const LEGACY_TAB_TO_INDEX: Record<string, number> = {
  "/pages/index/index": 0,
  "/pages/scan/index": 1,
  "/pages/ai-chat/index": 2,
  "/pages/mine/index": 3,
};

export function switchMainTab(index: number) {
  const n = Math.max(0, Math.min(3, Math.floor(index)));
  const pages = getCurrentPages();
  const top = pages[pages.length - 1] as { route?: string; __setMainTab?: (i: number) => void } | undefined;
  if (top?.route === "pages/tab-shell/index" && typeof top.__setMainTab === "function") {
    top.__setMainTab(n);
    return;
  }
  wx.reLaunch({ url: `${SHELL}?tab=${n}` });
}

/** 登录完成等场景：将 redirect 映射到壳页或普通页 */
export function launchMainShellFromRedirect(redirect: string) {
  const raw = (redirect || "").trim() || SHELL;
  const noHash = raw.split("#")[0] || raw;
  const [pathPart, queryPart] = noHash.split("?");
  const path = pathPart.startsWith("/") ? pathPart : `/${pathPart}`;

  if (path === SHELL || path.startsWith(`${SHELL}/`)) {
    const q = queryPart ? `?${queryPart}` : "";
    wx.reLaunch({ url: `${path}${q}` });
    return;
  }

  const mapped = LEGACY_TAB_TO_INDEX[path];
  if (mapped !== undefined) {
    wx.reLaunch({ url: `${SHELL}?tab=${mapped}` });
    return;
  }

  const full = queryPart ? `${path}?${queryPart}` : path;
  wx.redirectTo({
    url: full,
    fail: () => wx.reLaunch({ url: SHELL }),
  });
}
