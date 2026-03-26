import { NextResponse } from 'next/server';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

/**
 * GET /api/v1/uploads/config — Return upload constraints (no auth required)
 */
export async function GET() {
  return NextResponse.json({
    max_size: MAX_IMAGE_SIZE,
    allowed_types: ALLOWED_TYPES,
    presign_expires_in: 300,
  });
}
