import api from "./client";
import type { CustomerProfile, MePayload } from "../types/auth";

export interface RegisterPayload {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  postal_code?: string;
  region_code?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
  new_password_confirm: string;
}

export interface ValidateResetTokenResponse {
  detail: string;
  email: string;
  expires_at: string;
}

export interface DetailResponse {
  detail: string;
}

export async function register(payload: RegisterPayload): Promise<MePayload> {
  const { data } = await api.post<MePayload>("/auth/register/", payload);
  return data;
}

export async function login(payload: LoginPayload): Promise<MePayload> {
  const { data } = await api.post<MePayload>("/auth/login/", payload);
  return data;
}

export async function logout(): Promise<void> {
  await api.post<DetailResponse>("/auth/logout/");
}

export async function fetchMe(): Promise<MePayload> {
  const { data } = await api.get<MePayload>("/auth/me/");
  return data;
}

export async function updateProfile(payload: Partial<CustomerProfile>): Promise<CustomerProfile> {
  const { data } = await api.patch<CustomerProfile>("/auth/profile/", payload);
  return data;
}

export async function requestEmailVerification(): Promise<DetailResponse> {
  const { data } = await api.post<DetailResponse>("/auth/request-email-verification/");
  return data;
}

export async function verifyEmail(token: string): Promise<DetailResponse> {
  const { data } = await api.get<DetailResponse>("/auth/verify-email/", { params: { token } });
  return data;
}

export async function requestPhoneVerification(phone_number?: string): Promise<DetailResponse> {
  const { data } = await api.post<DetailResponse>("/auth/request-phone-verification/", {
    phone_number,
  });
  return data;
}

export async function verifyPhone(code: string): Promise<DetailResponse> {
  const { data } = await api.post<DetailResponse>("/auth/verify-phone/", { code });
  return data;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<DetailResponse> {
  const { data } = await api.post<DetailResponse>("/auth/change-password/", payload);
  return data;
}

export async function requestPasswordReset(email: string): Promise<DetailResponse> {
  const { data } = await api.post<DetailResponse>("/auth/request-password-reset/", { email });
  return data;
}

export async function validatePasswordResetToken(token: string): Promise<ValidateResetTokenResponse> {
  const { data } = await api.get<ValidateResetTokenResponse>("/auth/reset-password/validate/", {
    params: { token },
  });
  return data;
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<DetailResponse> {
  const { data } = await api.post<DetailResponse>("/auth/reset-password/", payload);
  return data;
}
