import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { getAllEvents } from '../../../server/controllers/eventsController.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const COOKIE_NAME = 'auth_token';

export default async (req: VercelRequest, res: VercelResponse) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

    const cookies: Record<string, string> = {};
    (req.headers.cookie || '').split(';').forEach((part) => {
        const [key, ...val] = part.trim().split('=');
        if (key) cookies[key.trim()] = decodeURIComponent(val.join('='));
    });

    const token = cookies[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try { jwt.verify(token, JWT_SECRET); }
    catch { return res.status(401).json({ error: 'Unauthorized' }); }

    try {
        await getAllEvents(req as any, res as any);
    } catch (error) {
        console.error(error);
        if (!res.headersSent) return res.status(500).json({ message: 'Internal Server Error' });
    }
};
