import './MonthListView.css'

import { formatEventDate } from '../utilities/FormatEventDate'

export default function MonthListView({events}) {

    const today = new Date();

    return (
        <section className='month-list-view'>
                {events.map(event => (
                    <div className={new Date(event.date) < today ? 'event completed' : 'event'} key={event.id}>
                        <div className='event-header-group'>
                            <h5>{event.title}</h5>
                            <button className='add-to-calendar-icon'>
                                <span className="material-symbols-outlined">
                                    calendar_add_on
                                </span>
                            </button>
                        </div>
                    
                    <hr />
                        <p className='body-large'>{formatEventDate(event.date)}</p>
                        <p className='body-large'>
                            {event.location.venue}
                            {event.location.building ? <><br/>{event.location.building}</> : ''}
                            </p>
                        <p>{event.description}</p>
                    </div>
                ))}
            </section>
    )
}