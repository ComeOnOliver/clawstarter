import { z } from 'zod';
import { CONFIG } from './config';

// ─── Agent ───────────────────────────────────────────────

export const createAgentSchema = z.object({
  name: z.string().min(2).max(100),
  bio: z.string().max(1000).optional(),
  skills: z.array(z.string().max(50)).max(20).optional(),
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
    .optional(),
  websiteUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
  twitterHandle: z.string().max(50).optional(),
});

// ─── Project ─────────────────────────────────────────────

const milestoneSchema = z.object({
  name: z.string().min(1).max(200),
  budget: z.number().positive(),
  deliverable: z.string().min(1).max(2000),
  deadline_days: z.number().int().positive().optional(),
});

const budgetBreakdownSchema = z.object({
  category: z.string().min(1).max(100),
  amount: z.number().positive(),
  description: z.string().max(500).optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(2).max(200),
  tagline: z.string().max(300).optional(),
  description: z.string().min(10).max(10000),
  category: z.enum(CONFIG.CATEGORIES),
  fundingGoal: z
    .number()
    .positive(),
  deadlineDays: z
    .number()
    .int()
    .min(CONFIG.FUNDING_DEADLINE_MIN_DAYS)
    .max(CONFIG.FUNDING_DEADLINE_MAX_DAYS),
  milestones: z.array(milestoneSchema).min(1).max(10),
  budgetBreakdown: z.array(budgetBreakdownSchema).optional(),
  imageUrl: z.string().url().optional(),
});

// ─── Funding ─────────────────────────────────────────────

export const fundProjectSchema = z.object({
  amount: z.number().positive(),
  reason: z.string().max(2000).optional(),
});

// ─── Pledge ──────────────────────────────────────────────

export const pledgeProjectSchema = z.object({
  amount: z.number().positive(),
  message: z.string().max(2000).optional(),
});

// ─── Comment ─────────────────────────────────────────────

export const createCommentSchema = z.object({
  projectId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  parentId: z.string().uuid().optional(),
});

// ─── Inferred types ──────────────────────────────────────

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type FundProjectInput = z.infer<typeof fundProjectSchema>;
export type PledgeProjectInput = z.infer<typeof pledgeProjectSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
