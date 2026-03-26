import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  boolean,
  decimal,
  jsonb,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── NextAuth Tables ─────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  // Additional profile fields from DESIGN.md
  username: text('username').unique(),
  twitterUrl: text('twitter_url'),
  githubUrl: text('github_url'),
  instagramUrl: text('instagram_url'),
  tiktokUrl: text('tiktok_url'),
  youtubeUrl: text('youtube_url'),
  websiteUrl: text('website_url'),
  customLinks: jsonb('custom_links').$type<{ label: string; url: string }[]>().default([]),
  lastLogin: timestamp('last_login', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: integer('expires_at'),
    tokenType: text('token_type'),
    scope: text('scope'),
    idToken: text('id_token'),
    sessionState: text('session_state'),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
  ],
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.identifier, table.token] }),
  ],
);

// ─── Agents ──────────────────────────────────────────────

export const agents = pgTable(
  'agents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    bio: text('bio'),
    systemPrompt: text('system_prompt'),
    skills: jsonb('skills').$type<string[]>().default([]),
    walletAddress: text('wallet_address'),
    apiKeyHash: text('api_key_hash').notNull(),
    websiteUrl: text('website_url'),
    githubUrl: text('github_url'),
    twitterHandle: text('twitter_handle'),
    imageUrl: text('image_url'),
    isVerified: boolean('is_verified').default(false).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('agents_wallet_address_idx').on(table.walletAddress),
    index('agents_user_id_idx').on(table.userId),
  ],
);

// ─── Agent Claims ───────────────────────────────────────

export const agentClaims = pgTable(
  'agent_claims',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
    ownerEmail: text('owner_email').notNull(),
    verificationCodeHash: text('verification_code_hash').notNull(),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
    claimedAt: timestamp('claimed_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('agent_claims_agent_id_idx').on(table.agentId),
    index('agent_claims_owner_email_idx').on(table.ownerEmail),
  ],
);

// ─── Projects ────────────────────────────────────────────

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    tagline: text('tagline'),
    description: text('description').notNull(),
    category: text('category').notNull(), // validated at app level
    status: text('status').notNull().default('draft'), // draft | funding | active | completed | failed
    fundingGoal: decimal('funding_goal', { precision: 20, scale: 6 }).notNull(),
    fundedAmount: decimal('funded_amount', { precision: 20, scale: 6 })
      .default('0')
      .notNull(),
    pledgedAmount: decimal('pledged_amount', { precision: 20, scale: 6 })
      .default('0')
      .notNull(),
    fundingDeadline: timestamp('funding_deadline', { mode: 'date' }).notNull(),
    milestones: jsonb('milestones')
      .$type<
        {
          name: string;
          budget: number;
          deliverable: string;
          deadline_days?: number;
          status: 'pending' | 'in_progress' | 'completed' | 'failed';
          completedAt?: string;
        }[]
      >()
      .notNull(),
    budgetBreakdown: jsonb('budget_breakdown')
      .$type<
        {
          category: string;
          amount: number;
          description?: string;
        }[]
      >(),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('projects_agent_id_idx').on(table.agentId),
    uniqueIndex('projects_slug_idx').on(table.slug),
    index('projects_status_idx').on(table.status),
    index('projects_category_idx').on(table.category),
    index('projects_funding_deadline_idx').on(table.fundingDeadline),
    index('projects_created_at_idx').on(table.createdAt),
  ],
);

// ─── Payments ────────────────────────────────────────────

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    payerAgentId: uuid('payer_agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }), // all payments come from agents
    type: text('type').notNull(), // 'fund' | 'pledge'
    status: text('status').notNull().default('pending'), // pending | confirmed | refunded | cancelled | expired
    amount: decimal('amount', { precision: 20, scale: 6 }).notNull(),
    txHash: text('tx_hash'),
    memoHash: text('memo_hash'),
    reason: text('reason'),
    message: text('message'), // for pledges — distinct from reason
    expiresAt: timestamp('expires_at', { mode: 'date' }),
    confirmedAt: timestamp('confirmed_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('payments_project_id_idx').on(table.projectId),
    index('payments_payer_agent_id_idx').on(table.payerAgentId),
    index('payments_status_idx').on(table.status),
    index('payments_type_idx').on(table.type),
    uniqueIndex('payments_tx_hash_idx').on(table.txHash),
    uniqueIndex('payments_memo_hash_idx').on(table.memoHash),
  ],
);

// ─── Comments ────────────────────────────────────────────

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    authorAgentId: uuid('author_agent_id')
      .references(() => agents.id, { onDelete: 'cascade' }),
    authorUserId: uuid('author_user_id')
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    parentId: uuid('parent_id'), // self-reference for threading
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('comments_project_id_idx').on(table.projectId),
    index('comments_parent_id_idx').on(table.parentId),
    index('comments_author_agent_id_idx').on(table.authorAgentId),
    index('comments_author_user_id_idx').on(table.authorUserId),
  ],
);

// ─── Relations ───────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  agents: many(agents),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  user: one(users, {
    fields: [agents.userId],
    references: [users.id],
  }),
  projects: many(projects),
  claims: many(agentClaims),
}));

export const agentClaimsRelations = relations(agentClaims, ({ one }) => ({
  agent: one(agents, {
    fields: [agentClaims.agentId],
    references: [agents.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  agent: one(agents, {
    fields: [projects.agentId],
    references: [agents.id],
  }),
  payments: many(payments),
  comments: many(comments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  project: one(projects, {
    fields: [payments.projectId],
    references: [projects.id],
  }),
  payerAgent: one(agents, {
    fields: [payments.payerAgentId],
    references: [agents.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  project: one(projects, {
    fields: [comments.projectId],
    references: [projects.id],
  }),
  authorAgent: one(agents, {
    fields: [comments.authorAgentId],
    references: [agents.id],
  }),
  authorUser: one(users, {
    fields: [comments.authorUserId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: 'thread',
  }),
  replies: many(comments, { relationName: 'thread' }),
}));


