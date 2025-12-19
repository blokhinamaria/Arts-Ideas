import './MonthListView.css'

import { formatEventDate } from '../utilities/FormatEventDate'
import Event from '../event-components/Event'
import { useEffect, useState } from 'react';

export default function MonthListView({events}) {

    const today = new Date();

    function useMediaQuery(query) {
        const [ matches, setMatches ] = useState(false)

        useEffect(() => {
            const mediaQuery = window.matchMedia(query);
            const checkQuery = () => setMatches(mediaQuery.matches)

            checkQuery();

            mediaQuery.addEventListener('change', checkQuery)

            return () => mediaQuery.removeEventListener('change', checkQuery)
        }, [query])

        return matches;
    }

    const isMobile = useMediaQuery('(max-width: 679px')

    const [ isExpanded, setIsExpanded ] = useState([]);

        function handleEventClick(id) {
            if (isExpanded.includes(id)) {
                setIsExpanded(prev => prev.filter(item => item !== id))
            } else {
                setIsExpanded(prev => [...prev, id])
            }
        }

    return (
        <section className='month-list-view'>
            {events.map(event => {

                if (!isMobile) {
                    return <Event key={event.id} event={event}/>   
                }

                if (new Date(event.date) < today && isExpanded.includes(event.id)) {
                    return (
                        <div onClick={() => handleEventClick(event.id)} key={event.id}>
                            <Event
                                event={event}
                            />
                        </div>
                    )
                    
                } else if (new Date(event.date) < today) {
                    return (
                        <div key={event.id}
                            className="default-event completed"
                            onClick={() => handleEventClick(event.id)}>
                            <h5>{event.title}</h5>
                            <hr />
                            <p className="body-large">{formatEventDate(event.date)}</p>
                        </div>
                    )
                    
                } else {
                    return <Event key={event.id} event={event}/>   
                }
            })}
        </section>
    )
}