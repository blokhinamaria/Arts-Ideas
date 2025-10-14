import { formatEventDate } from "../utilities/FormatEventDate"

import EventTitleGroup from "./EventTitleGroup"
import Location from "./Location"


import './Event.css'

export default function Event({event, today}) {

    return (
        <div className={new Date(event.date) < today ? 'default-event completed' : 'default-event'}>
            <EventTitleGroup event={event} />
            <hr />
            <p className='body-large'>{formatEventDate(event.date)}</p>
            <Location event={event} />
            <p>{event.description}</p>
        </div>
    )
}