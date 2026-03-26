import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, eq } from '@/lib/db/client';
import { users } from '@/lib/db/schema';

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, image, websiteUrl, githubUrl, twitterUrl, instagramUrl } = body;

  // Basic validation
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (name !== undefined) {
    if (typeof name !== 'string' || name.length > 100) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }
    updates.name = name || null;
  }
  if (image !== undefined) {
    if (image && typeof image === 'string' && image.length > 0) {
      try { new URL(image); } catch {
        return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
      }
    }
    updates.image = image || null;
  }
  if (websiteUrl !== undefined) {
    if (websiteUrl && typeof websiteUrl === 'string' && websiteUrl.length > 0) {
      try { new URL(websiteUrl); } catch {
        return NextResponse.json({ error: 'Invalid website URL' }, { status: 400 });
      }
    }
    updates.websiteUrl = websiteUrl || null;
  }
  if (githubUrl !== undefined) {
    if (githubUrl && typeof githubUrl === 'string' && githubUrl.length > 0) {
      try { new URL(githubUrl); } catch {
        return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
      }
    }
    updates.githubUrl = githubUrl || null;
  }
  if (twitterUrl !== undefined) {
    updates.twitterUrl = (typeof twitterUrl === 'string' ? twitterUrl : null) || null;
  }
  if (instagramUrl !== undefined) {
    updates.instagramUrl = (typeof instagramUrl === 'string' ? instagramUrl : null) || null;
  }

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, session.user.id))
    .returning({
      id: users.id,
      name: users.name,
      image: users.image,
      websiteUrl: users.websiteUrl,
      githubUrl: users.githubUrl,
      twitterUrl: users.twitterUrl,
      instagramUrl: users.instagramUrl,
    });

  return NextResponse.json({ success: true, data: updated });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      websiteUrl: users.websiteUrl,
      githubUrl: users.githubUrl,
      twitterUrl: users.twitterUrl,
      instagramUrl: users.instagramUrl,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: user });
}
