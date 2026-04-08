import { put } from '@vercel/blob';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
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
    if (!file.type.startsWith('image/')) {
      return Response.json({ success: false, message: 'Only image uploads are supported' }, { status: 400 });
    }

    const pathname = `campaigns/${Date.now()}-${file.name}`.replace(/[^a-zA-Z0-9._/\\-]/g, '_');
    const blob = await put(pathname, file, { access: 'public', token, addRandomSuffix: true });
    return Response.json({ success: true, url: blob.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Upload failed';
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}
