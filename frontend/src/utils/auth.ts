import { jwtDecode } from 'jwt-decode';

export enum Role {
  ADMIN = 'ADMIN',
  DATA_ENTRY = 'DATA_ENTRY',
  EDITOR = 'EDITOR',
  REPORT_VIEWER = 'REPORT_VIEWER',
}

interface DecodedToken {
  sub: string;
  role: Role;
  exp: number;
}

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const getUserRole = (): Role | null => {
  const token = getToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.role;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export const hasRole = (allowedRoles: Role[]): boolean => {
  const userRole = getUserRole();
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};
