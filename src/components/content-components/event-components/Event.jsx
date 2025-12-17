import { formatEventDate } from "../utilities/FormatEventDate"

import EventTitleGroup from "./EventTitleGroup"
import Location from "./Location"


import './Event.css'

export default function Event({event}) {

    const today = new Date()

    return (
        <div className={new Date(event.dates[event.dates.length - 1].start_date) < today ? 'default-event completed' : 'default-event'}>
            <EventTitleGroup event={event} />
            <hr />
            {event.dates.map(date => (
                <p key={`${event._id}${date.start_date}`} className='body-large'>{formatEventDate(date.start_date)}</p>
            ))} 
            <Location location={event.location} />
            <p>{event.description}</p>
        </div>
    )
}