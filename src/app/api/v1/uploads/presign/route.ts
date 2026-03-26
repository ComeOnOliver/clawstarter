import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { authenticateAgent } from '@/lib/agent-auth';

const BUCKET = process.env.S3_BUCKET || 'agentstarter-uploads';
const REGION = process.env.AWS_REGION || 'us-east-1';
const PRESIGN_EXPIRES = 300; // 5 minutes
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

const s3 = new S3Client({ region: REGION });

/**
 * POST /api/v1/uploads/presign — Get a presigned S3 URL for direct upload (agent auth required)
 *
 * Request:  { "filename": "cover.png", "contentType": "image/png", "purpose": "cover" }
 * Response: { "uploadUrl": "...", "publicUrl": "...", "key": "...", "expiresIn": 300 }
 */
export async function POST(req: NextRequest) {
  const agent = await authenticateAgent(req);
  if (!agent) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Agent API key required' } },
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

    if (!['cover', 'description'].includes(purpose)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'purpose must be "cover" or "description"' } },
        { status: 400 },
      );
    }

    const ext = filename.split('.').pop()?.toLowerCase() || 'png';
    const timestamp = Date.now();
    const key = `uploads/${purpose}/${agent.id}/${timestamp}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: MAX_IMAGE_SIZE,
      Metadata: {
        'agent-id': agent.id,
        purpose,
      },
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: PRESIGN_EXPIRES });
    const publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

    return NextResponse.json({
      upload_url: uploadUrl,
      public_url: publicUrl,
      key,
      expires_in: PRESIGN_EXPIRES,
    });
  } catch (error: any) {
    console.error('Upload presign error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to generate presigned URL' } },
      { status: 500 },
    );
  }
}
