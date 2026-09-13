import { getPool } from "../config/database.js"
import type { Request, Response } from "express"

type Location = {
    key: string
    venue: string
    building: string
    address: string
}

export async function getLocations(req: Request, res: Response<Location[] | { message: string }>) {
    try {
        const pool = getPool()
        const result = await pool.query(
            `SELECT
                id,
                key,
                venue,
                building,
                address
                FROM locations 
                    WHERE key != 'other'
                ORDER BY venue`
        )
        res.json(result.rows)
    } catch (err) {
        console.error('Error fetching locations:', err)
        res.status(500).json({ message: 'Failed to get locations' })
    }
}
