import EventTitleGroup from "./EventTitleGroup"
import EventDate from './EventDate'
import EventLocation from "./EventLocation"
import type { EventType } from "./EventCard"

import './Event.css'

export default function EventCardCalendarView({event}:{event:EventType}) {

    return (
        <div style={{ padding: '0'}}>
            {
                event.dates.map(date => (
                    <EventDate key={date.start_date} 
                        date={date}
                        format='time'
                    />
                ))
            }
            <EventTitleGroup title={event.title} />
            <hr />
            <EventLocation location={event.location} />
            <p>{event.description}</p>
        </div>
    )
}