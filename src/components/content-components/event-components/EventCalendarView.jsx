import { formatEventDate } from "../utilities/FormatEventDate"

import EventTitleGroup from "./EventTitleGroup"
import Location from "./Location"

import './Event.css'

export default function EventCalendarView({event}) {

    return (
        <div
            style={{ padding: '0'}}>
            {
                event.dates.map(date => (
                    <p key={`${event.id}${date.start_date}`} className='body-large'>{formatEventDate(date.start_date, 'time')}</p>
                ))
            }
            <EventTitleGroup event={event} />
            <hr />
            <Location location={event.location} />
            <p>{event.description}</p>
        </div>
    )
}