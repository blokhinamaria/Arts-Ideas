import { pool } from "../config/database"

import type { Request, Response } from "express"

type Event = {
    id: number;
    title: string;
    date: string;
    locationKey: string;
    coverImageUrl: string;
    category: string;
    description: string;
    contact?: {
        contactName: string,
        contactEmail: string,
    };
    isPublic: boolean;
    price?: string;
    status: string;
    tags?: string[];
}

function buildEventsQuery(whereClause: string = ''): string {
    return `
        SELECT e.*, 
        json_agg(
            json_build_object(
            'start_date', ed.start_date,
            'end_date', ed.end_date
            ) ORDER BY ed.start_date
        ) AS dates,
        (
            SELECT json_build_object(
                'location_key', l.key,
                'venue', l.venue,
                'building', l.building,
                'address', l.address,
                'map_url', l.map_url
                )
                FROM locations l
                WHERE l.key = e.location_key
        ) AS location
        FROM events e
        JOIN event_dates ed ON e.id = ed.event_id
        JOIN locations l ON e.location_key = l.key
        ${whereClause}
        GROUP BY e.id
        ORDER BY MIN(ed.start_date)
    `;
}

export async function getMonthEvents (req:Request, res:Response<Event[] | {message:string}>) {
    try {
        const {month, year} = req.query as { month?: string; year?: string };

        if (!month) {
            res.status(400).json({message: 'Failed to fetch events. Month is required'})
            return
        }

        if (!year) {
            res.status(400).json({message: 'Failed to fetch events. Year is required'})
            return
        }

        const monthNum = parseInt(month)
        const yearNum = parseInt(year)

        if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
            res.status(400).json({ message: 'Invalid month or year' });
            return 
            }

        const query = buildEventsQuery(`
            WHERE EXTRACT(MONTH FROM ed.start_date) = $1 
                AND EXTRACT(YEAR FROM ed.start_date) = $2
            `);

        const result = await pool.query(query, [monthNum, yearNum])

        if (!result.rows || result.rows.length === 0) {
            res.status(400).json({ message: `No events found for month ${monthNum} and year ${yearNum}` });
            return
        }

        res.json(result.rows)

    } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({message: `Failed to get events`})
    }
}


export async function getUpcomingEvents (req:Request, res:Response<Event[] | {message:string}>) {
    try {
        
        const today = new Date();
        const cutOffTime = today.setMinutes(today.getMinutes() - 45)

        const query = `
                SELECT e.*, 
                    json_agg(
                        json_build_object(
                        'start_date', ed.start_date,
                        'end_date', ed.end_date
                        ) ORDER BY ed.start_date
                    ) AS dates,
                    (
                    SELECT json_build_object(
                    'location_key', l.key,
                    'venue', l.venue,
                    'building', l.building,
                    'address', l.address,
                    'map_url', l.map_url
                    )
                    FROM locations l
                    WHERE l.key = e.location_key
                ) AS location
                    FROM events e
                    JOIN event_dates ed ON e.id = ed.event_id
                    JOIN locations l ON e.location_key = l.key
                    WHERE ed.start_date > NOW()
                    GROUP BY e.id
                    ORDER BY MIN(ed.start_date)
                    LIMIT 3
        `

        const result = await pool.query(query)

        if (!result.rows || result.rows.length === 0) {
            res.status(400).json({ message: `No upcoming events found` });
            return
        }

        res.json(result.rows)

    } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({message: `Failed to get upcoming events`})
    }
}