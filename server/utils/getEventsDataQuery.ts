type EventStatus = 'published' | 'pending'

type TableSet = {
    eventsTable: string
    eventDatesTable: string
    customLocationsTable: string
    locationsTable: string
}

export function getEventsDataQuery(
    eventStatus: EventStatus = 'published',
    addCustomLocations = false,
    whereClause = '',
    paginationClause = 'LIMIT $1 OFFSET $2'
) {
    const tables: Record<EventStatus, TableSet> = {
        published: {
            eventsTable: 'events',
            eventDatesTable: 'event_dates',
            customLocationsTable: 'custom_locations',
            locationsTable: 'locations',
        },
        pending: {
            eventsTable: 'new_events',
            eventDatesTable: 'new_event_dates',
            customLocationsTable: 'new_custom_locations',
            locationsTable: 'locations',
        }
    }

    const { eventsTable, eventDatesTable, customLocationsTable, locationsTable } = tables[eventStatus]

    const customLocationSelect = addCustomLocations ? `
        (
            SELECT json_build_object(
                'location_key', 'other',
                'venue', l.venue,
                'building', l.building,
                'address', l.address,
                'map_url', l.map_url
                )
                FROM ${customLocationsTable} l
                    WHERE l.event_id = e.id
            ) as custom_location,
        ` : ''

    const statusFilter = `status = '${eventStatus}'`
    const normalizedWhereClause = whereClause.trim()
    const finalWhereClause = normalizedWhereClause
        ? `${normalizedWhereClause}`
        : `WHERE ${statusFilter}`

    return `
        SELECT e.*, 
            json_agg(
                json_build_object(
                    'start_date', ed.start_date,
                    'end_date', ed.end_date
                    ) ORDER BY ed.start_date
                ) AS dates,
                ${customLocationSelect}
                CASE
                    WHEN e.location_id=0 THEN (
                        SELECT json_build_object(
                            'location_key', 'other',
                            'venue', l.venue,
                            'building', l.building,
                            'address', l.address,
                            'map_url', l.map_url
                            )
                            FROM ${customLocationsTable} l
                                WHERE l.event_id = e.id
                        )
                    ELSE (
                        SELECT json_build_object(
                            'location_key', l.key,
                            'venue', l.venue,
                            'building', l.building,
                            'address', l.address,
                            'map_url', l.map_url
                            )
                            FROM ${locationsTable} l
                                WHERE l.id = e.location_id
                        )
                    END AS location
            FROM ${eventsTable} e
            JOIN ${eventDatesTable} ed ON e.id = ed.event_id
            JOIN ${locationsTable} l ON e.location_id = l.id
            LEFT JOIN ${customLocationsTable} cl ON e.id = cl.event_id
            ${finalWhereClause}
            GROUP BY e.id
            ORDER BY MIN(ed.start_date)
            ${paginationClause};
    `
}
