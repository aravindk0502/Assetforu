import { put } from '@vercel/blob';
import { getBlobReadWriteToken } from '@/app/api/_utils/blobToken';
import { requireAdmin } from '@/app/api/_utils/adminAuth';
import { getClientIp, rateLimitOrThrow } from '@/app/api/_utils/security';

export const runtime = 'nodejs';

const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // 6MB
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

function safeFileName(name: string) {
  const base = String(name || 'upload').split('/').pop() || 'upload';
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'upload';
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  try {
    const ip = getClientIp(req);
    rateLimitOrThrow({ key: `upload:ip:${ip}`, limit: 60, windowMs: 15 * 60 * 1000 });

    const token = getBlobReadWriteToken();
    if (!token) {
      return Response.json(
        { success: false, message: 'Blob storage is not configured (BLOB_READ_WRITE_TOKEN missing)' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return Response.json({ success: false, message: 'Missing file' }, { status: 400 });
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return Response.json({ success: false, message: 'Unsupported image type' }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return Response.json({ success: false, message: 'Image too large' }, { status: 400 });
    }

    const pathname = `uploads/${Date.now()}-${safeFileName(file.name)}`;
    const blob = await put(pathname, file, { access: 'public', token, addRandomSuffix: true });
    return Response.json({ success: true, url: blob.url });
  } catch (e) {
    if (e && typeof e === 'object' && (e as any).status === 429) {
      const retryAfter = (e as any).retryAfterSeconds || 60;
      return new Response(JSON.stringify({ success: false, message: 'Too many requests' }), {
        status: 429,
        headers: { 'content-type': 'application/json', 'retry-after': String(retryAfter) },
      });
    }
    const msg = e instanceof Error ? e.message : 'Upload failed';
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}
