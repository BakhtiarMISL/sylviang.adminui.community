export interface ILoginRequest {
  username: string;
  password: string;
}

export interface ILoginResponse {
  accessToken: string;
  expiresAtUtc: string;
  username: string;
  displayName: string;
  role: string;
  employeeId: number | null;
}

export interface IChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}
