import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { getPool } from "../config/database.js"

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const COOKIE_NAME = "auth_token";
const isProd = process.env.NODE_ENV === 'production';

const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: 1000 * 60 * 60 * 24
};

export async function login(req: Request, res: Response) {
    const { username, password } = req.body;
    const pool = getPool()
    try {
        const result = await pool.query(
            `SELECT id, username, password_hash, role FROM users WHERE username = $1`,
            [username]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const valid = await bcrypt.compare(password, user.password_hash);

        if (!valid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const payload = { id: user.id, username: user.username, role: user.role };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });

        res.cookie(COOKIE_NAME, token, cookieOptions);
        res.json({ user: payload });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Login failed" });
    }
}

export function getMe(req: Request, res: Response) {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ user: null });

    try {
        const user = jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string };
        res.json({ user: { id: user.id, username: user.username, role: user.role } });
    } catch {
        return res.status(401).json({ user: null });
    }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
        (req as Request & { user: unknown }).user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: "Unauthorized" });
    }
}

export function logout(req: Request, res: Response) {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: isProd,
        sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax'
    });
    res.json({ success: true });
}
