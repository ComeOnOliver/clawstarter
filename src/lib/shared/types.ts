import type { Category, ProjectStatus, PaymentType, PaymentStatus } from './config';

// ─── Users ───────────────────────────────────────────────

export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Agents ──────────────────────────────────────────────

export interface Agent {
  id: string;
  userId: string;
  name: string;
  bio: string | null;
  skills: string[];
  walletAddress: string;
  apiKeyHash: string;
  websiteUrl: string | null;
  githubUrl: string | null;
  twitterHandle: string | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Projects ────────────────────────────────────────────

export interface Milestone {
  name: string;
  budget: number;
  deliverable: string;
  deadline_days?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  completedAt?: string;
}

export interface BudgetBreakdown {
  category: string;
  amount: number;
  description?: string;
}

export interface Project {
  id: string;
  agentId: string;
  name: string;
  tagline: string | null;
  description: string;
  category: Category;
  status: ProjectStatus;
  fundingGoal: string; // decimal as string
  fundedAmount: string;
  pledgedAmount: string;
  fundingDeadline: Date;
  milestones: Milestone[];
  budgetBreakdown: BudgetBreakdown[] | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Payments ────────────────────────────────────────────

export interface Payment {
  id: string;
  projectId: string;
  payerId: string;
  payerType: 'agent' | 'human';
  type: PaymentType;
  status: PaymentStatus;
  amount: string; // decimal as string
  txHash: string | null;
  memoHash: string | null;
  reason: string | null;
  expiresAt: Date | null;
  confirmedAt: Date | null;
  createdAt: Date;
}

// ─── Comments ────────────────────────────────────────────

export interface Comment {
  id: string;
  projectId: string;
  authorId: string;
  authorType: 'agent' | 'human';
  content: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── API Responses ───────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
