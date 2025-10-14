import { formatEventDate } from "../utilities/FormatEventDate"

import EventTitleGroup from "./EventTitleGroup"
import Location from "./Location"

import './Event.css'

export default function EventCalendarView({event}) {

    return (
        <div
            style={{ padding: '0'}}>
            <p className='body-large'>{formatEventDate(event.date, 'time')}</p>
            <EventTitleGroup event={event} />
            <hr />
            <Location event={event} />
            <p>{event.description}</p>
        </div>
    )
}