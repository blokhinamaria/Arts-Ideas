import EventTitleGroup from "./EventTitleGroup"
import EventLocation from "./EventLocation"

import './Event.css'
import EventDate from "./EventDate"

export type EventType = {
    id:number,
    category:string,
    title: string,
    dates: EventDateType[],
    location: EventLocationType,
    location_key: string,
    description:string,
    img_id: string,
    img_url: string,
    
    contact: {
        contactName:string,
        contactEmail:string
    },
    
    is_public: boolean,
    price: string,
    status: string,
    tags: string[],

    created_at:string, 
    updated_at: string  
}

export type EventDateType = {
    start_date: string,
    end_date: string | null
}

export type EventLocationType = {
    location_key: string,
    venue: string,
    building: string,
    address: string,
    map_url: string,
}

type EventCardProps = {
    event:EventType,
    format?: 'full' | 'short'
}

export default function EventCard({event, format='full'}:EventCardProps) {

    const today:Date = new Date()
    const eventStartDate:Date = new Date(event.dates[event.dates.length - 1].start_date)

    return (
        <div className={eventStartDate < today ? 'default-event completed' : 'default-event'}>
            <EventTitleGroup title={event.title}/>
            <hr />
            {event.dates.map(date => (
                <EventDate
                    key={date.start_date}
                    date={date}/>
            ))} 
            {format==='full' && 
                <>
                    <EventLocation location={event.location} />
                    <p>{event.description}</p>
                </>
            }
        </div>
    )
}