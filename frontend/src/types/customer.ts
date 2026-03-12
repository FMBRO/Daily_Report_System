/**
 * 顧客型
 */

export interface Customer {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSummary {
  id: string;
  name: string;
  address?: string;
}

export interface CustomerListParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

export interface CreateCustomerRequest {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  notes?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  notes?: string;
  isActive?: boolean;
}
