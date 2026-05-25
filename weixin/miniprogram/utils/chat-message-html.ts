/** 咨询助手气泡：纯文本展示（与 webview 渲染下 rich-text html 兼容性更好） */

/** 轻量规整：缓解「1.2.3.」黏在一行的情况 */
export function normalizeAssistantSpacing(s: string): string {
  let t = String(s || "").replace(/\r\n/g, "\n");
  t = t.replace(/([。；])\s*(\d+\.\s)/g, "$1\n\n$2");
  t = t.replace(/\n{4,}/g, "\n\n\n");
  return t.trim();
}

/** 去掉成对 **加粗** 标记，避免界面上露出星号 */
export function stripMarkdownBoldMarkers(s: string): string {
  let t = String(s || "");
  let prev = "";
  while (prev !== t) {
    prev = t;
    t = t.replace(/\*\*([^*]+)\*\*/g, "$1");
  }
  return t.replace(/\*\*/g, "");
}

/** 历史记录 / 回复结束后的最终展示文案 */
export function plainAssistantDisplay(s: string): string {
  return stripMarkdownBoldMarkers(normalizeAssistantSpacing(s));
}
