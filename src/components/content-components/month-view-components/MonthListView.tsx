import './MonthListView.css'
import { ReactNode, useEffect, useState } from 'react';
import EventCard, { type EventType } from '../event-components/EventCard'

import { hasEventPassed } from '../utilities/HasEventPassed';

export default function MonthListView({events}:{events: EventType[]}) {

    function useMediaQuery(query:string):boolean {
        const [ matches, setMatches ] = useState<boolean>(false)

        useEffect(() => {
            const mediaQuery = window.matchMedia(query);
            const checkQuery = ():void => setMatches(mediaQuery.matches)

            checkQuery();

            mediaQuery.addEventListener('change', checkQuery)

            return () => mediaQuery.removeEventListener('change', checkQuery)
        }, [query])

        return matches;
    }

    const isMobile:boolean = useMediaQuery('(max-width: 679px')

    const [ expandedEventIds, setExpandedEventIds ] = useState<number[]>([]);

    function handleEventClick(id:number) {
        if (expandedEventIds.includes(id)) {
            setExpandedEventIds((prev:number[]):number[] => prev.filter((item:number):boolean => item !== id))
        } else {
            setExpandedEventIds((prev:number[]):number[] => [...prev, id])
        }
    }

    return (
        <section className='month-list-view'>
            {events.map((event:EventType):ReactNode => {
                //not mobile => regular card
                if (!isMobile) {
                    return <EventCard key={event.id} event={event}/> 
                }
                //on mobile and upcoming, show full
                if (hasEventPassed(event.dates) && !expandedEventIds.includes(event.id)) {
                    return (
                        <div
                            key={event.id}
                            onClick={()=>handleEventClick(event.id)}
                            >
                                <EventCard
                                    event={event}
                                    format='short'
                                    />   
                        </div>
                    )
                } else {
                    return (
                        <div
                            key={event.id}
                            onClick={()=>handleEventClick(event.id)}
                        >
                        <EventCard
                            event={event}
                            />   
                    </div>
                    )
                }
            })}
        </section>
    )
}