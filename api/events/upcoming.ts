import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUpcomingEvents } from "../../server/controllers/eventsController.js";

export default async (req: VercelRequest, res: VercelResponse) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed'})
    }

    try {
        await getUpcomingEvents(req as any, res as any);
    } catch (error) {
        console.error(error)
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Internal Server Error'})
        }
    }
};