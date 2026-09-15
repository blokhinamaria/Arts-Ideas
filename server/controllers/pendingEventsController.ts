import { getPool } from '../config/database.js'
import type { Request, Response } from 'express'

type DatePayload = {
    start_date: string
    end_date: string | null
}

// ── GET /api/events/pending ──────────────────────────────────────────────────

export async function getPendingEvents(req: Request, res: Response) {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1)
        const limit = 50
        const offset = (page - 1) * limit

        const pool = getPool()

        const countQuery = `
            SELECT COUNT(*) FROM new_events WHERE status = 'pending'
        `

        const dataQuery = `
            SELECT ne.*, 
                json_agg(
                    json_build_object(
                        'start_date', ned.start_date,
                        'end_date', ned.end_date
                        ) ORDER BY ned.start_date
                    ) AS dates,
                    (
                        SELECT json_build_object(
                            'location_key', 'other',
                            'venue', l.venue,
                            'building', l.building,
                            'address', l.address,
                            'map_url', l.map_url
                            )
                            FROM new_custom_locations l
                                WHERE l.event_id = ne.id
                        ) as custom_location,
                    CASE
                        WHEN ne.location_id=0 THEN (
                            SELECT json_build_object(
                                'location_key', 'other',
                                'venue', l.venue,
                                'building', l.building,
                                'address', l.address,
                                'map_url', l.map_url
                                )
                                FROM new_custom_locations l
                                    WHERE l.event_id = ne.id
                            )
                        ELSE (
                            SELECT json_build_object(
                                'location_key', l.key,
                                'venue', l.venue,
                                'building', l.building,
                                'address', l.address,
                                'map_url', l.map_url
                                )
                                FROM locations l
                                    WHERE l.id = ne.location_id
                            )
                        END AS location
                FROM new_events ne
                JOIN new_event_dates ned ON ne.id = ned.event_id
                JOIN locations l ON ne.location_id = l.id
                LEFT JOIN new_custom_locations ncl ON ne.id = ncl.event_id
                WHERE status = 'pending'
                GROUP BY ne.id
                ORDER BY MIN(ned.start_date)
            LIMIT $1 OFFSET $2;
        `

        const [countResult, dataResult] = await Promise.all([
            pool.query(countQuery),
            pool.query(dataQuery, [limit, offset]),
        ])

        const total = parseInt(countResult.rows[0].count)
        res.json({ events: dataResult.rows, total, page, totalPages: Math.ceil(total / limit) })

    } catch (err) {
        console.error('Error fetching pending events:', err)
        res.status(500).json({ message: 'Failed to get pending events' })
    }
}

function getPendingEventPayload(base: Record<string, any>) {
    const {
        title,
        location_key,
        location_id,
        location,
        description,
        category,
        tags,
        contact_name,
        contact_email,
        contact_phone,
        status,
        dates,
        img_id
    } = base

    return {
        title,
        location_key,
        location_id,
        location,
        description,
        category,
        tags,
        contact_name,
        contact_email,
        contact_phone,
        status,
        dates,
        img_id
    }
}

async function savePendingEventData(
    client: any,
    id: number,
    payload: ReturnType<typeof getPendingEventPayload>
) {
    const {
        title,
        location_key,
        location_id,
        location,
        description,
        category,
        tags,
        contact_name,
        contact_email,
        contact_phone,
        status,
        dates,
        img_id
    } = payload

    if (!title || !location_key || !description || !category || !Array.isArray(dates) || dates.length === 0) {
        throw new Error('Missing required fields')
    }

    if (location_key === 'other') {
        if (!location ||
            ((!location.venue?.trim() && !location.building?.trim()) || !location.address?.trim())) {
            throw new Error('Event Location is missing required information')
        }

        const venue = (location.venue?.trim() || location.building?.trim()) as string
        const building = location.venue?.trim() && location.building?.trim()
            ? location.building.trim()
            : null

        
        await client.query(`
            INSERT INTO new_custom_locations (
                event_id,
                venue,
                building,
                address,
                map_url
            )
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (event_id)
            DO UPDATE SET
                venue = $2,
                building = $3,
                address = $4,
                map_url = $5
                WHERE new_custom_locations.event_id = $1;
                ;
            `, [
                id,
                venue,
                building,
                location.address,
                location.map_url ?? null
            ])
    }

    await client.query(
        `UPDATE new_events
            SET title=$1,
                location_key=$2,
                location_id=$3,
                description=$4,
                category=$5,
                tags=$6,
                contact_name=$7,
                contact_email=$8,
                contact_phone=$9,
                status=$10,
                updated_at=NOW(),
                img_id=$11
            WHERE id=$12`,
        [
            title,
            location_key,
            location_id ?? null,
            description,
            category,
            tags ?? [],
            contact_name ?? null,
            contact_email ?? null,
            contact_phone ?? null,
            status ?? 'pending',
            img_id ?? null,
            id
        ]
    )

    await client.query('DELETE FROM new_event_dates WHERE event_id=$1', [id])

    for (const date of dates) {
        await client.query(
            'INSERT INTO new_event_dates (event_id, start_date, end_date) VALUES ($1, $2, $3)',
            [id, date.start_date, date.end_date ?? null]
        )
    }
}

// ── PUT /api/events/pending/:id ──────────────────────────────────────────────

export async function updatePendingEvent(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id)
        if (isNaN(id)) { res.status(400).json({ message: 'Invalid id' }); return }

        const payload = getPendingEventPayload(req.body)

        const pool = getPool()
        const client = await pool.connect()
        try {
            await client.query('BEGIN')
            await savePendingEventData(client, id, payload)
            await client.query('COMMIT')
            res.json({ message: 'Pending event updated' })
        } catch (err) {
            await client.query('ROLLBACK')
            throw err
        } finally {
            client.release()
        }
    } catch (err) {
        console.error('Error updating pending event:', err)

        if (err instanceof Error && err.message === 'Missing required fields') {
            res.status(400).json({ message: 'Missing required fields' })
            return
        }

        if (err instanceof Error && err.message === 'Event Location is missing required information') {
            res.status(400).json({ message: 'Event Location is missing required information' })
            return
        }

        res.status(500).json({ message: 'Failed to update pending event' })
    }
}

// ── DELETE /api/events/pending/:id ───────────────────────────────────────────

export async function deletePendingEvent(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id)
        if (isNaN(id)) { res.status(400).json({ message: 'Invalid id' }); return }

        const pool = getPool()
        // new_event_dates should CASCADE on delete; also delete explicitly to be safe
        await pool.query('DELETE FROM new_event_dates WHERE event_id=$1', [id])
        await pool.query('DELETE FROM new_events WHERE id=$1', [id])

        res.json({ message: 'Pending event deleted' })
    } catch (err) {
        console.error('Error deleting pending event:', err)
        res.status(500).json({ message: 'Failed to delete pending event' })
    }
}

// ── POST /api/events/pending/:id/publish ─────────────────────────────────────

export async function publishPendingEvent(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id)
        if (isNaN(id)) { res.status(400).json({ message: 'Invalid id' }); return }

        const payload = getPendingEventPayload(req.body)

        const pool = getPool()
        const client = await pool.connect()

        try {
            await client.query('BEGIN')
            await savePendingEventData(client, id, payload)

            // Fetch the pending event
            const eventResult = await client.query(
                `SELECT ne.*,
                        json_agg(
                            json_build_object('start_date', ned.start_date, 'end_date', ned.end_date)
                            ORDER BY ned.start_date
                        ) FILTER (WHERE ned.id IS NOT NULL) AS dates_normalized
                    FROM new_events ne
                    LEFT JOIN new_event_dates ned ON ne.id = ned.event_id
                    WHERE ne.id = $1
                    GROUP BY ne.id`,
                [id]
            )

            if (eventResult.rows.length === 0) {
                await client.query('ROLLBACK')
                res.status(404).json({ message: 'Pending event not found' })
                return
            }

            const ne = eventResult.rows[0]

            // Resolve dates: prefer new_event_dates, fall back to JSON column
            let event_dates: DatePayload[]
            if (ne.dates_normalized) {
                event_dates = ne.dates_normalized
            } else {
                try { event_dates = JSON.parse(ne.dates ?? '[]') } catch { event_dates = [] }
            }

            if (event_dates.length === 0) {
                await client.query('ROLLBACK')
                res.status(400).json({ message: 'Event has no dates' })
                return
            }

            // Resolve category
            const finalCategory = (ne.category === 'Other' && ne.custom_category)
                ? ne.custom_category
                : ne.category

            // Insert into events
            const insertEvent = await client.query(
                `INSERT INTO events (
                        title,
                        description,
                        location_key,
                        location_id,
                        category,
                        tags,
                        contact,
                        status,
                        img_id,
                        created_at,
                        updated_at
                    )
                        VALUES ($1, $2, $3, $4, $5, $6, 'published', $7, NOW(), NOW())
                        RETURNING id`,
                [
                    ne.title,
                    ne.description,
                    ne.location_key,
                    ne.location_id,
                    finalCategory,
                    ne.tags ?? [],
                    JSON.stringify({
                        contactName: ne.contact_name ?? '',
                        contactEmail: ne.contact_email ?? '',
                    }),
                    ne.img_id ?? null,
                ]
            )

            const publishedId: number = insertEvent.rows[0].id

            // Insert event_dates
            for (const date of event_dates) {
                await client.query(
                    'INSERT INTO event_dates (event_id, start_date, end_date) VALUES ($1, $2, $3)',
                    [publishedId, date.start_date, date.end_date ?? null]
                )
            }

            // Mark pending event as published
            await client.query(
                `DELETE FROM new_event_dates WHERE id=$1`,
                [id]
            )

            await client.query(
                `DELETE FROM new_events WHERE event_id=$1`,
                [id]
            )

            await client.query('COMMIT')
            res.json({ message: 'Event published', publishedId })

        } catch (err) {
            await client.query('ROLLBACK')
            throw err
        } finally {
            client.release()
        }
    } catch (err) {
        console.error('Error publishing event:', err)
        res.status(500).json({ message: 'Failed to publish event' })
    }
}
