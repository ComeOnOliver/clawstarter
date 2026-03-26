import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { db, eq, and, sql } from '@/lib/db/client';
import { payments, projects, rewards } from '@/lib/db/schema';
import { pledgeProjectSchema } from '@/lib/shared/validators';
import { CONFIG } from '@/lib/shared/config';
import { requireAgent } from '@/lib/agent-auth';

/**
 * POST /api/v1/payments/pledge/[projectId] — Declare pledge intent
 * Agent auth required. Creates a pending pledge payment with on-chain instructions.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { agent, error } = await requireAgent(req);
  if (error) return error;

  const { projectId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body' } },
      { status: 400 },
    );
  }

  const parsed = pledgeProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
      { status: 400 },
    );
  }

  // Verify project exists and is in funding status
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Project not found' } },
      { status: 404 },
    );
  }

  if (project.status !== 'funding') {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Project is not accepting pledges' } },
      { status: 400 },
    );
  }

  if (project.fundingDeadline < new Date()) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Funding deadline has passed' } },
      { status: 400 },
    );
  }

  // Validate optional reward_id
  const rewardId = (body as Record<string, unknown>).reward_id as string | undefined;
  let selectedReward: { id: string; amount: string; quantityLimit: number | null; quantityClaimed: number } | null = null;

  if (rewardId) {
    const [reward] = await db
      .select()
      .from(rewards)
      .where(and(eq(rewards.id, rewardId), eq(rewards.projectId, projectId)))
      .limit(1);

    if (!reward) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Reward not found for this project' } },
        { status: 404 },
      );
    }

    if (parsed.data.amount < parseFloat(reward.amount)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: `Amount must be at least ${reward.amount} for this reward tier` } },
        { status: 400 },
      );
    }

    if (reward.quantityLimit !== null && reward.quantityClaimed >= reward.quantityLimit) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'This reward tier is sold out' } },
        { status: 400 },
      );
    }

    selectedReward = reward;
  }

  // Generate memo hash for on-chain payment identification
  const memoHash =
    '0x' +
    crypto
      .createHash('sha256')
      .update(`${crypto.randomUUID()}:${projectId}:${Date.now()}`)
      .digest('hex');

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CONFIG.PAYMENT_EXPIRY_HOURS);

  const [payment] = await db
    .insert(payments)
    .values({
      projectId,
      payerAgentId: agent.id,
      type: 'pledge',
      status: 'pending',
      amount: parsed.data.amount.toString(),
      memoHash,
      message: parsed.data.message ?? null,
      reason: parsed.data.message ?? null,
      rewardId: selectedReward?.id ?? null,
      expiresAt,
    })
    .returning();

  return NextResponse.json(
    {
      data: {
        payment_id: payment.id,
        memo_hash: payment.memoHash,
        amount: payment.amount,
        expires_at: payment.expiresAt,
        instructions: {
          chain: CONFIG.CHAIN.NAME,
          chain_id: CONFIG.CHAIN.ID,
          token: 'USDC',
          token_address: CONFIG.CHAIN.USDC_ADDRESS,
          decimals: CONFIG.CHAIN.USDC_DECIMALS,
          contract_address: process.env.CONTRACT_ADDRESS,
          memo: payment.memoHash,
        },
      },
    },
    { status: 201 },
  );
}
