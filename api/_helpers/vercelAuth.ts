import jwt from 'jsonwebtoken';
import type { VercelRequest } from '@vercel/node';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const COOKIE_NAME = 'auth_token';

export function verifyCookie(req: VercelRequest): boolean {
    const cookies: Record<string, string> = {};
    (req.headers.cookie || '').split(';').forEach((part) => {
        const [key, ...val] = part.trim().split('=');
        if (key) cookies[key.trim()] = decodeURIComponent(val.join('='));
    });
    try {
        jwt.verify(cookies[COOKIE_NAME] ?? '', JWT_SECRET);
        return true;
    } catch {
        return false;
    }
}

export function corsHeaders(req: VercelRequest) {
    return {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': req.headers.origin || '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Accept',
    };
}
