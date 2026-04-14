import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyCookie, corsHeaders } from '../_helpers/vercelAuth.js';
import { listFolders } from '../../server/controllers/imageController.js';

export default async (req: VercelRequest, res: VercelResponse) => {
    Object.entries(corsHeaders(req)).forEach(([k, v]) => res.setHeader(k, v));
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
    if (!verifyCookie(req)) return res.status(401).json({ error: 'Unauthorized' });
    try {
        await listFolders(req as any, res as any);
    } catch (err) {
        console.error(err);
        if (!res.headersSent) res.status(500).json({ message: 'Internal Server Error' });
    }
};
