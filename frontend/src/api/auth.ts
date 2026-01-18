import apiClient from './client';
import type { AuthResponse, TokenResponse, User, LoginRequest, RegisterRequest } from '../types';

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/register', data);
  return response.data;
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const response = await apiClient.post<TokenResponse>('/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
}

export async function refreshToken(token: string): Promise<{ access_token: string }> {
  const response = await apiClient.post('/auth/refresh', { refresh_token: token });
  return response.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refresh_token: refreshToken });
}

export async function getMe(): Promise<User> {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
}
