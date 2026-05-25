import { get, post } from "../utils/request";

export interface LoginResponse {
  token: string;
  expiresIn: number;
  user: {
    id: string;
    nickName: string;
    avatarUrl: string;
    gender: number;
  };
}

export function wxLogin(code: string, nickName?: string, avatarUrl?: string) {
  return post<LoginResponse>("/api/auth/wx-login", { code, nickName, avatarUrl });
}

export function refreshToken() {
  return post<{ token: string; expiresIn: number }>("/api/auth/refresh");
}

export function getMe() {
  return get<any>("/api/auth/me");
}
