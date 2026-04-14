import type { VercelRequest, VercelResponse } from '@vercel/node';
import { IncomingForm } from 'formidable';
import { verifyCookie, corsHeaders } from '../_helpers/vercelAuth.js';
import cloudinary from '../../server/config/cloudinary.js';

// Disable Vercel's built-in body parser so formidable can parse multipart
export const config = { api: { bodyParser: false } };

export default async (req: VercelRequest, res: VercelResponse) => {
    Object.entries(corsHeaders(req)).forEach(([k, v]) => res.setHeader(k, v));
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
    if (!verifyCookie(req)) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const form = new IncomingForm({ maxFileSize: 10 * 1024 * 1024 });
        const { fields, files } = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
            form.parse(req as any, (err, fields, files) => {
                if (err) reject(err);
                else resolve({ fields, files });
            });
        });

        const file = Array.isArray(files.file) ? files.file[0] : files.file;
        if (!file) return res.status(400).json({ message: 'No file provided' });

        const folder: string = Array.isArray(fields.folder) ? fields.folder[0] : (fields.folder ?? '');
        const filename: string = (Array.isArray(fields.filename) ? fields.filename[0] : fields.filename ?? '').trim();
        if (!filename) return res.status(400).json({ message: 'filename is required' });

        const publicId = folder ? `${folder}/${filename}` : filename;

        const result = await cloudinary.uploader.upload(file.filepath, {
            public_id: publicId,
            use_filename: false,
            overwrite: false,
            resource_type: 'image',
        });

        res.json({
            public_id: result.public_id,
            secure_url: result.secure_url,
            format: result.format,
            width: result.width,
            height: result.height,
        });
    } catch (err: any) {
        console.error('Error uploading image:', err);
        if (err?.http_code === 400 && err?.message?.includes('already exists')) {
            return res.status(409).json({ message: 'An image with that name already exists in this folder.' });
        }
        if (!res.headersSent) res.status(500).json({ message: 'Internal Server Error' });
    }
};
