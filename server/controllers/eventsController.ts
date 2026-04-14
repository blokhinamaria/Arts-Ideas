import { getPool } from "../config/database.js"

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

function buildEventsQuery(whereClause: string = ''):string {
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

        const monthNum:number = parseInt(month)
        const yearNum:number = parseInt(year)

        if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
            res.status(400).json({ message: 'Invalid month or year' });
            return 
            }

        const query:string = buildEventsQuery(`
            WHERE EXTRACT(MONTH FROM ed.start_date) = $1 
                AND EXTRACT(YEAR FROM ed.start_date) = $2
            `);
        const pool = getPool();
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


export async function getAcademicYears(req: Request, res: Response) {
    try {
        const pool = getPool();
        const result = await pool.query(`
            SELECT DISTINCT
                CASE
                    WHEN EXTRACT(MONTH FROM ed.start_date) > 8
                      OR (EXTRACT(MONTH FROM ed.start_date) = 8 AND EXTRACT(DAY FROM ed.start_date) >= 15)
                    THEN EXTRACT(YEAR FROM ed.start_date)::int
                    ELSE (EXTRACT(YEAR FROM ed.start_date) - 1)::int
                END AS year_start
            FROM event_dates ed
            ORDER BY year_start
        `);
        res.json({ years: result.rows.map((r: { year_start: number }) => r.year_start) });
    } catch (err) {
        console.error('Error fetching academic years:', err);
        res.status(500).json({ message: 'Failed to get academic years' });
    }
}


export async function getAllEvents(req: Request, res: Response) {
    try {
        const yearStart = parseInt(req.query.year as string);
        if (isNaN(yearStart)) {
            res.status(400).json({ message: 'year is required' });
            return;
        }
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = 50;
        const offset = (page - 1) * limit;

        const rangeStart = `${yearStart}-08-15 00:00:00`;
        const rangeEnd   = `${yearStart + 1}-08-15 00:00:00`;

        const pool = getPool();

        const countQuery = `
            SELECT COUNT(DISTINCT e.id)
            FROM events e
            JOIN event_dates ed ON e.id = ed.event_id
            WHERE e.id IN (
                SELECT event_id FROM event_dates
                WHERE start_date >= $1 AND start_date < $2
            )
        `;

        const dataQuery = `
            SELECT e.id, e.title, e.description, e.category, e.tags,
                   e.contact, e.status, e.img_id, e.created_at, e.updated_at,
                   e.location_key,
                   json_agg(
                       json_build_object('start_date', ed.start_date, 'end_date', ed.end_date)
                       ORDER BY ed.start_date
                   ) AS dates,
                   l.venue, l.building
            FROM events e
            JOIN event_dates ed ON e.id = ed.event_id
            JOIN locations l ON e.location_key = l.key
            WHERE e.id IN (
                SELECT event_id FROM event_dates
                WHERE start_date >= $1 AND start_date < $2
            )
            GROUP BY e.id, l.venue, l.building
            ORDER BY MIN(ed.start_date)
            LIMIT $3 OFFSET $4
        `;

        const [countResult, dataResult] = await Promise.all([
            pool.query(countQuery, [rangeStart, rangeEnd]),
            pool.query(dataQuery, [rangeStart, rangeEnd, limit, offset]),
        ]);

        const total = parseInt(countResult.rows[0].count);
        res.json({
            events: dataResult.rows,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (err) {
        console.error('Error fetching all events:', err);
        res.status(500).json({ message: 'Failed to get events' });
    }
}


export async function updateAdminEvent(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: 'Invalid event id' });
            return;
        }

        const { title, location_key, description, category, tags, contact, status, dates } = req.body;

        if (!title || !location_key || !description || !category || !status || !Array.isArray(dates) || dates.length === 0) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }

        const pool = getPool();
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            await client.query(
                `UPDATE events
                 SET title=$1, location_key=$2, description=$3, category=$4,
                     tags=$5, contact=$6, status=$7, updated_at=NOW()
                 WHERE id=$8`,
                [title, location_key, description, category, tags ?? [], contact, status, id]
            );

            await client.query('DELETE FROM event_dates WHERE event_id=$1', [id]);

            for (const date of dates) {
                await client.query(
                    'INSERT INTO event_dates (event_id, start_date, end_date) VALUES ($1, $2, $3)',
                    [id, date.start_date, date.end_date ?? null]
                );
            }

            await client.query('COMMIT');
            res.json({ message: 'Event updated' });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Error updating event:', err);
        res.status(500).json({ message: 'Failed to update event' });
    }
}


export async function getAdminEvents(req: Request, res: Response) {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = 50;
        const offset = (page - 1) * limit;

        const pool = getPool();

        const countQuery = `
            SELECT COUNT(DISTINCT e.id)
            FROM events e
            JOIN event_dates ed ON e.id = ed.event_id
            WHERE e.id IN (
                SELECT event_id FROM event_dates
                WHERE start_date >= NOW()
                   OR (end_date IS NOT NULL AND end_date >= NOW())
            )
        `;

        const dataQuery = `
            SELECT e.id, e.title, e.description, e.category, e.tags,
                   e.contact, e.status, e.img_id, e.created_at, e.updated_at,
                   e.location_key,
                   json_agg(
                       json_build_object('start_date', ed.start_date, 'end_date', ed.end_date)
                       ORDER BY ed.start_date
                   ) AS dates,
                   l.venue,
                   l.building
            FROM events e
            JOIN event_dates ed ON e.id = ed.event_id
            JOIN locations l ON e.location_key = l.key
            WHERE e.id IN (
                SELECT event_id FROM event_dates
                WHERE start_date >= NOW()
                   OR (end_date IS NOT NULL AND end_date >= NOW())
            )
            GROUP BY e.id, l.venue, l.building
            ORDER BY MIN(ed.start_date)
            LIMIT $1 OFFSET $2
        `;

        const [countResult, dataResult] = await Promise.all([
            pool.query(countQuery),
            pool.query(dataQuery, [limit, offset]),
        ]);

        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limit);

        res.json({
            events: dataResult.rows,
            total,
            page,
            totalPages,
        });

    } catch (err) {
        console.error('Error fetching admin events:', err);
        res.status(500).json({ message: 'Failed to get admin events' });
    }
}


export async function getUpcomingEvents (req:Request, res:Response<Event[] | {message:string}>) {
    try {
        
        const today:Date = new Date();
        const cutOffTime:Date = new Date(today.setMinutes(today.getMinutes() - 45))

        const query:string = `
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
                    WHERE ed.start_date > $1 AT TIME ZONE 'America/New_York'
                    GROUP BY e.id
                    ORDER BY MIN(ed.start_date)
                    LIMIT 3
        `
        const pool = getPool()
        const result = await pool.query(query, [cutOffTime])

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