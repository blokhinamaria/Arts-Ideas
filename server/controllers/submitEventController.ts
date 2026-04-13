import { getPool } from '../config/database.js'
import type { Request, Response } from 'express'

type DatePayload = {
    start_date: string
    end_date: string | null
}

type SubmitEventBody = {
    submitter_name: string
    submitter_email: string
    title: string
    description: string
    location_key: string
    custom_location?: string | null
    category: string
    custom_category?: string | null
    contact_email: string
    contact_phone?: string | null
    contact_name?: string | null
    dates: DatePayload[]
}

export async function submitNewEvent(
    req: Request<object, object, SubmitEventBody>,
    res: Response<{ message: string; id?: number }>
): Promise<void> {
    try {
        const {
            submitter_name,
            submitter_email,
            title,
            description,
            location_key,
            custom_location,
            category,
            custom_category,
            contact_email,
            contact_phone,
            contact_name,
            dates,
        } = req.body

        if (
            !submitter_name ||
            !submitter_email ||
            !title ||
            !description ||
            !location_key ||
            !category ||
            !contact_email ||
            !Array.isArray(dates) ||
            dates.length === 0
        ) {
            res.status(400).json({ message: 'Missing required fields' })
            return
        }

        if (!submitter_email.toLowerCase().endsWith('@ut.edu')) {
            res.status(400).json({ message: 'Submitter email must be a @ut.edu address' })
            return
        }

        const today = new Date().toISOString().split('T')[0]
        for (const d of dates) {
            if (!d.start_date || d.start_date < today) {
                res.status(400).json({ message: 'All event dates must be in the future' })
                return
            }
            if (d.end_date && d.end_date <= d.start_date) {
                res.status(400).json({ message: 'End date must be after start date' })
                return
            }
        }

        const pool = getPool()

        const result = await pool.query(
            `INSERT INTO new_events
                (submitter_name, submitter_email, title, description,
                 location_key, custom_location, category, custom_category,
                 contact_email, contact_phone, contact_name, dates, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending')
             RETURNING id`,
            [
                submitter_name,
                submitter_email,
                title,
                description,
                location_key,
                custom_location ?? null,
                category,
                custom_category ?? null,
                contact_email,
                contact_phone ?? null,
                contact_name ?? null,
                JSON.stringify(dates),
            ]
        )

        res.status(201).json({ message: 'Event submitted successfully', id: result.rows[0].id })
    } catch (err) {
        console.error('Error submitting event:', err)
        res.status(500).json({ message: 'Failed to submit event. Please try again.' })
    }
}
