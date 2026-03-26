import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { authenticateAgent } from '@/lib/agent-auth';
import { auth } from '@/lib/auth';

const BUCKET = (process.env.S3_BUCKET || 'agentstarter-uploads').trim();
const REGION = (process.env.AWS_REGION || 'us-east-1').trim();
const PRESIGN_EXPIRES = 300; // 5 minutes
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

function getS3Client() {
  return new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: (process.env.AWS_ACCESS_KEY_ID || '').trim(),
      secretAccessKey: (process.env.AWS_SECRET_ACCESS_KEY || '').trim(),
    },
  });
}

/**
 * POST /api/v1/uploads/presign — Get a presigned S3 URL for direct upload
 * Auth: agent API key OR NextAuth session (human)
 *
 * Request:  { "filename": "cover.png", "contentType": "image/png", "purpose": "cover" | "description" | "avatar" }
 * Response: { "uploadUrl": "...", "publicUrl": "...", "key": "...", "expiresIn": 300 }
 */
export async function POST(req: NextRequest) {
  // Try agent auth first, then fall back to session auth
  const agent = await authenticateAgent(req);
  let authId: string | null = agent?.id ?? null;
  let authType: 'agent' | 'user' = 'agent';

  if (!authId) {
    const session = await auth();
    if (session?.user?.id) {
      authId = session.user.id;
      authType = 'user';
    }
  }

  if (!authId) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Agent API key or login session required' } },
      { status: 401 },
    );
  }

  try {
    const body = await req.json();
    const { filename, contentType, purpose = 'cover' } = body;

    if (!filename || typeof filename !== 'string' || filename.length > 255) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'filename is required (max 255 chars)' } },
        { status: 400 },
      );
    }

    if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: `Unsupported content type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
          },
        },
        { status: 400 },
      );
    }

    if (!['cover', 'description', 'avatar'].includes(purpose)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'purpose must be "cover", "description", or "avatar"' } },
        { status: 400 },
      );
    }

    const ext = filename.split('.').pop()?.toLowerCase() || 'png';
    const timestamp = Date.now();
    const key = `uploads/${purpose}/${authId}/${timestamp}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      Metadata: {
        [`${authType}-id`]: authId,
        purpose,
      },
    });

    const s3 = getS3Client();
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: PRESIGN_EXPIRES });
    const publicUrl = `https://assets.clawstarter.app/assets/${key}`;

    return NextResponse.json({
      upload_url: uploadUrl,
      public_url: publicUrl,
      key,
      expires_in: PRESIGN_EXPIRES,
    });
  } catch (error: any) {
    console.error('Upload presign error:', error);
    const hasAccessKey = !!process.env.AWS_ACCESS_KEY_ID;
    const hasSecretKey = !!process.env.AWS_SECRET_ACCESS_KEY;
    console.error(`AWS env check: ACCESS_KEY=${hasAccessKey}, SECRET_KEY=${hasSecretKey}, REGION=${REGION}, BUCKET=${BUCKET}`);
    return NextResponse.json(
      { error: { code: 'UPLOAD_ERROR', message: error.message || 'Failed to generate presigned URL', debug: { hasAccessKey, hasSecretKey, region: REGION, bucket: BUCKET } } },
      { status: 500 },
    );
  }
}
