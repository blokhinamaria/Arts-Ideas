import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { updatePendingEvent, deletePendingEvent } from '../../../../server/controllers/pendingEventsController.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const COOKIE_NAME = 'auth_token';

function verifyCookie(req: VercelRequest): boolean {
    const cookies: Record<string, string> = {};
    (req.headers.cookie || '').split(';').forEach((part) => {
        const [key, ...val] = part.trim().split('=');
        if (key) cookies[key.trim()] = decodeURIComponent(val.join('='));
    });
    try { jwt.verify(cookies[COOKIE_NAME] ?? '', JWT_SECRET); return true; }
    catch { return false; }
}

export default async (req: VercelRequest, res: VercelResponse) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (!verifyCookie(req)) return res.status(401).json({ error: 'Unauthorized' });

    try {
        if (req.method === 'PUT') {
            await updatePendingEvent(req as any, res as any);
        } else if (req.method === 'DELETE') {
            await deletePendingEvent(req as any, res as any);
        } else {
            return res.status(405).json({ message: 'Method not allowed' });
        }
    } catch (error) {
        console.error(error);
        if (!res.headersSent) return res.status(500).json({ message: 'Internal Server Error' });
    }
};
