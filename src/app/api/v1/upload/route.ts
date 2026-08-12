import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getSession } from '@/lib/auth/session';
import { rateLimit } from '@/lib/auth/rate-limiter';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Rate limit: 10 uploads per minute per user
    const limit = await rateLimit(`upload_${session.userId}`, 10, 60000);
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many uploads. Please try again later.' }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type || !ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type '${file.type}'. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` },
        { status: 400 }
      );
    }

    // Convert file to array buffer and then to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        base64Data,
        {
          folder: `tenant_${session.tenantId}/products`,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    return NextResponse.json({ 
      url: (uploadResult as any).secure_url,
      public_id: (uploadResult as any).public_id
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error during upload' }, { status: 500 });
  }
}

