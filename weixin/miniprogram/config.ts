/**
 * 全局配置项
 * 本地开发和上线部署只改这里即可
 */

const isDev = true; // 上线后改为 false

const config = {
  /** 后端 API 地址 */
  baseUrl: isDev ? "http://localhost:8080" : "http://47.98.99.93",

  /** 请求超时（毫秒） */
  timeout: 20000,

  /** MinIO 文件访问前缀（头像、扫描图等） */
  fileBaseUrl: isDev ? "http://47.98.99.93:9000" : "http://47.98.99.93:9000",
};

export default config;
