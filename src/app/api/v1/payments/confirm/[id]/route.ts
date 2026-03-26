import { NextRequest, NextResponse } from 'next/server';
import { db, eq, and, sql } from '@/lib/db/client';
import { payments, projects, rewards } from '@/lib/db/schema';
import { requireAgent } from '@/lib/agent-auth';

const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;

/**
 * POST /api/v1/payments/confirm/[id] — Confirm payment with on-chain tx hash
 * Agent auth required. Uses DB transaction + conditional update to prevent race conditions.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { agent, error } = await requireAgent(req);
  if (error) return error;

  const { id: paymentId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body' } },
      { status: 400 },
    );
  }

  const { tx_hash } = body as { tx_hash?: string };

  // Validate tx_hash format
  if (!tx_hash || typeof tx_hash !== 'string' || !TX_HASH_REGEX.test(tx_hash)) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message:
            'Invalid transaction hash format. Must be 0x followed by 64 hex characters.',
        },
      },
      { status: 400 },
    );
  }

  // Check for duplicate tx_hash
  const [existingTx] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(eq(payments.txHash, tx_hash))
    .limit(1);

  if (existingTx) {
    return NextResponse.json(
      { error: { code: 'CONFLICT', message: 'Transaction hash already used' } },
      { status: 409 },
    );
  }

  // Look up payment and verify ownership
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);

  if (!payment) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Payment not found' } },
      { status: 404 },
    );
  }

  if (payment.payerAgentId !== agent.id) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'You can only confirm your own payments' } },
      { status: 403 },
    );
  }

  // Check expiry
  if (payment.expiresAt && payment.expiresAt < new Date()) {
    await db
      .update(payments)
      .set({ status: 'expired' })
      .where(eq(payments.id, paymentId));

    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Payment has expired' } },
      { status: 400 },
    );
  }

  // Atomic DB transaction with conditional update
  const result = await db.transaction(async (tx) => {
    // Atomically update only if still pending (prevents double-confirm)
    const [updated] = await tx
      .update(payments)
      .set({
        txHash: tx_hash,
        status: 'confirmed',
        confirmedAt: new Date(),
      })
      .where(and(eq(payments.id, paymentId), eq(payments.status, 'pending')))
      .returning();

    if (!updated) {
      return null; // Already confirmed or status changed
    }

    // Update project amounts atomically using SQL arithmetic
    if (updated.type === 'fund') {
      await tx
        .update(projects)
        .set({
          fundedAmount: sql`${projects.fundedAmount} + ${updated.amount}::decimal`,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, updated.projectId));

      // Check if funding goal reached
      const [project] = await tx
        .select({
          id: projects.id,
          fundedAmount: projects.fundedAmount,
          fundingGoal: projects.fundingGoal,
        })
        .from(projects)
        .where(eq(projects.id, updated.projectId))
        .limit(1);

      if (
        project &&
        parseFloat(project.fundedAmount) >= parseFloat(project.fundingGoal)
      ) {
        await tx
          .update(projects)
          .set({ status: 'active' })
          .where(eq(projects.id, project.id));
      }
    } else if (updated.type === 'pledge') {
      await tx
        .update(projects)
        .set({
          pledgedAmount: sql`${projects.pledgedAmount} + ${updated.amount}::decimal`,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, updated.projectId));
    }

    // Increment reward quantity_claimed if reward was selected
    if (updated.rewardId) {
      await tx
        .update(rewards)
        .set({
          quantityClaimed: sql`${rewards.quantityClaimed} + 1`,
        })
        .where(eq(rewards.id, updated.rewardId));
    }

    return updated;
  });

  if (!result) {
    return NextResponse.json(
      {
        error: {
          code: 'BAD_REQUEST',
          message: 'Payment is not confirmable (already confirmed or status changed)',
        },
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ data: result });
}
