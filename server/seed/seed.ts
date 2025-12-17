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

type Location = {
    key: string,
    venue: string,
    building?: string,
    address: string,
    mapUrl: string
}

function readJsonFile<T>(filePath: string): T {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
}

async function seedEvents() {
    console.log("Seeding Events...")

    //Read current files
    
    const dataDir = "/Users/blokhinamaria/Desktop/Arts-Ideas/public/data";
    const file = 'locations.json';

    let totalLocations = 0;
    console.log(`Processing ${file}...`)
    const locations: Location[] = readJsonFile(join(dataDir, file));    

        for (const location of locations) {
            try {
                await pool.query(
                    `INSERT INTO locations (
                        key, venue, building, address, map_url
                    ) VALUES ($1, $2, $3, $4, $5) 
                        RETURNING id`,
                        [
                            location.key,
                            location.venue,
                            location.building || null,
                            location.address,
                            location.mapUrl
                        ]
                )

                totalLocations++;

            } catch (err) {
                console.error(`Error inserting ${location.key}: ${err}`)
            }
        }
    
    console.log(`Inserted ${totalLocations} locations`)
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