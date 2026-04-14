import type { VercelRequest, VercelResponse } from '@vercel/node';
import { IncomingForm } from 'formidable';
import { corsHeaders } from '../_helpers/vercelAuth.js';
import cloudinary from '../../server/config/cloudinary.js';

export const config = { api: { bodyParser: false } };

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

export default async (req: VercelRequest, res: VercelResponse) => {
    Object.entries(corsHeaders(req)).forEach(([k, v]) => res.setHeader(k, v));
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

    try {
        const form = new IncomingForm({ maxFileSize: MAX_BYTES + 1 });
        const { files } = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
            form.parse(req as any, (err, fields, files) => {
                if (err) reject(err);
                else resolve({ fields, files });
            });
        });

        const file = Array.isArray(files.file) ? files.file[0] : files.file;
        if (!file) return res.status(400).json({ message: 'No file provided' });

        if (!ALLOWED_MIMES.includes(file.mimetype ?? '')) {
            return res.status(400).json({ message: 'Only JPEG, PNG, and WebP images are accepted.' });
        }
        if (file.size > MAX_BYTES) {
            return res.status(400).json({ message: 'Image must be 5 MB or smaller.' });
        }

        const publicId = `Arts&Ideas/pending/submission-${Date.now()}`;
        const result = await cloudinary.uploader.upload(file.filepath, {
            public_id: publicId,
            use_filename: false,
            overwrite: false,
            resource_type: 'image',
        });

        res.json({ public_id: result.public_id, secure_url: result.secure_url });
    } catch (err) {
        console.error('Error uploading public image:', err);
        if (!res.headersSent) res.status(500).json({ message: 'Internal Server Error' });
    }
};
