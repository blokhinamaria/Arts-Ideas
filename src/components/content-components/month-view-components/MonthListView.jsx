import './MonthListView.css'

import { formatEventDate } from '../utilities/FormatEventDate'
import Event from '../event-components/Event'
import { useState } from 'react';

export default function MonthListView({events}) {

    const today = new Date();

    const [ isExpanded, setIsExpanded ] = useState(null);

    function handleClick(id) {
        if (isExpanded === id) {
            setIsExpanded(null)
        } else {
            setIsExpanded(id)
        }
    }
 
    return (
        <section className='month-list-view'>
            {events.map(event => (
                ( new Date(event.date) < today && isExpanded === event.id ) ? (
                    <div onClick={() => handleClick(event.id)} key={event.id}>
                        <Event
                            event={event}
                            today={today}
                        />
                    </div>
                                                                
                ) : ( new Date(event.date) < today ) ? (
                    <div key={event.id}
                        className="default-event completed"
                        onClick={() => handleClick(event.id)}>
                            <h5>{event.title}</h5>
                            <hr />
                            <p className="body-large">{formatEventDate(event.date)}</p>
                    </div>
                ) : (
                    <Event key={event.id} event={event} today={today}/>
                )         
            ))}
        </section>
    )
}