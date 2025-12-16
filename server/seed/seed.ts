import { pool } from "../config/database";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

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

function readJsonFile<T>(filePath: string): T {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
}

async function seedEvents() {
    console.log("Seeding Events...")

    //Read current files
    
    const dataDir = "/Users/blokhinamaria/Desktop/Arts-Ideas/public/data";
    const files = readdirSync(dataDir).filter(f => f.match(/\d{4}-\d{2}\.json$/));

    let totalEvents = 0;
    for (const fileName of files) {
        console.log(`Processing ${fileName}...`)
        const events: Event[] = readJsonFile(join(dataDir, fileName));

        for (const event of events) {
            try {
                const result = await pool.query(
                    `INSERT INTO events (
                        title, location_key, img_url, category, description, contact, is_public, price, status, tags
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
                        RETURNING id`,
                        [
                            event.title,
                            event.locationKey,
                            event.coverImageUrl,
                            event.category || null,
                            event.description || null,
                            event.contact ? JSON.stringify(event.contact) : null,
                            event.isPublic,
                            event.price || null,
                            event.status,
                            event.tags || []
                        ]
                )
                const eventId = await result.rows[0].id

                await pool.query(
                    `INSERT INTO event_dates (
                        event_id, start_date
                    ) VALUES (
                        $1, $2
                    )`, 
                    [eventId, new Date(event.date)]
                )

                totalEvents++;

            } catch (err) {
                console.error(`Error inserting ${event.id} ${event.title}: ${err}`)
            }
        }
    }
    console.log(`Inserted ${totalEvents} events`)
}

async function main() {
    console.log(`Starting seed...`)
    try {
        await pool.connect();
        console.log(`Database connected`)
        await seedEvents()
        console.log('Seed completed')
    } catch (err) {
        console.error(`Seed failed: ${err}`)
    } finally {
        await pool.end()
    }
}

main()