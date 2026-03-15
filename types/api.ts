/**
 * Type definitions for API responses and session objects.
 */
import type { DashboardSpec } from "./spec";

/** Project returned by the API */
export interface ProjectDTO {
  id: string;
  name: string;
  userId: string;
  specJson: DashboardSpec;
  createdAt: string;
  updatedAt: string;
}

/** DashboardData record DTO */
export interface DashboardDataDTO {
  id: string;
  projectId: string;
  entity: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Computed metric result */
export interface MetricResult {
  name: string;
  value: number | string;
}

/** Generic API response wrapper */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Session user shape (used with NextAuth) */
export interface SessionUser {
  id: string;
  email: string;
}
