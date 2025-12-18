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

type Image = {
    display_name: string,
    url: string,
}

function readJsonFile<T>(filePath: string): T {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
}

async function seedEvents() {
    console.log("Seeding Events...")

    //Read current files
    
    const dataDir = "/Users/blokhinamaria/Desktop/Arts-Ideas/public/data";
    const file = 'image_data.json';

    let totalImages = 0;
    console.log(`Processing ${file}...`)
    const images: Image[] = readJsonFile(join(dataDir, file));    

        for (const image of images) {
            try {
                await pool.query(
                    `UPDATE images (
                        name, url
                    ) VALUES ($1, $2) 
                        RETURNING id`,
                        [
                            image.display_name.split('_')[0],
                            image.url,
                        ]
                )

                console.log(image.display_name.split('_')[0])

                totalImages++;

            } catch (err) {
                console.error(`Error inserting ${image.display_name}: ${err}`)
            }
        }
    
    console.log(`Inserted ${totalImages} images`)
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