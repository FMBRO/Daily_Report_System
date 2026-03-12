/**
 * 営業担当者型
 */

import type { UserRole } from "./auth";

export interface Salesperson {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  managerId?: string;
  manager?: SalespersonSummary;
  subordinates?: SalespersonSummary[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SalespersonSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface SalespersonListParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  managerId?: string;
  isActive?: boolean;
  search?: string;
}

export interface CreateSalespersonRequest {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  managerId?: string;
}

export interface UpdateSalespersonRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  managerId?: string;
  isActive?: boolean;
}
