import type {VercelRequest, VercelResponse} from '@vercel/node'
import { getLocations } from '../../server/controllers/locationsController';

export default async (req: VercelRequest, res: VercelResponse) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');

    if (req.method === 'OPTION') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed'});
    }

    try {
        await getLocations(req as any, res as any);
    } catch (error) {
        console.log(error) 
        if (!res.headersSent) {
            return res.status(500).json({message: 'Internal Server Error'})
        }
    }

}