import { formatEventDate } from "../utilities/FormatEventDate"

import EventTitleGroup from "./EventTitleGroup"
import Location from "./Location"


import './Event.css'

export default function Event({event, today}) {
    console.log(event)

    return (
        <div className={new Date(event.dates[event.dates.length - 1].start_date) < today ? 'default-event completed' : 'default-event'}>
            <EventTitleGroup event={event} />
            <hr />
            {event.dates.map(date => (
                <p className='body-large'>{formatEventDate(date.start_date)}</p>
            ))} 
            <Location event={event} />
            <p>{event.description}</p>
        </div>
    )
}