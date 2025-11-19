import './MonthCalendarView.css';

import { formatEventDate } from '../utilities/FormatEventDate';
import { useEffect, useState } from 'react';

import Event from '../event-components/Event';
import EventCalendarView from '../event-components/EventCalendarView';

export default function MonthCalendarView({events, selectedDate, showPast}) {

    const today = new Date();

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    const daysInMonth= getDaysInMonth();

    function getDaysInMonth() {
        return new Date(year, month + 1, 0).getDate();
    };

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    const weekdayLabels = weekdays.map(day => (
        <div key={day} className="calendar-day day-of-week"><h5>{day}</h5></div>
    ))

    const calendarDays = [];

    function useMediaQuery(query) {
        const [ matches, setMatches ] = useState(false);

        useEffect(() => {
            const mediaQuery = window.matchMedia(query)
            const checkQuery = () => setMatches(mediaQuery.matches)

            checkQuery();

            mediaQuery.addEventListener('change', checkQuery)

            return () => mediaQuery.removeEventListener('change', checkQuery)
        }, [query])

        return matches;
    }

    const isMobile = useMediaQuery('(max-width: 768px')

    //empty lots before the first day
    const [ firstDay, setFirstDay ] = useState(new Date(year, month, 1));

    useEffect(() => {
        if (today.getMonth() !== selectedDate.getMonth()) {
            setFirstDay(new Date(year, month, 1));
            return;
        }
        if (!showPast) {
            const dayOfWeek = today.getDay();
            if (dayOfWeek !== 0 && !isMobile) {
                const dayOfMonth = today.getDate();
                const sundayDate = dayOfMonth - dayOfWeek;
                setFirstDay(new Date(year, month, sundayDate))
            } else {
                setFirstDay(new Date(year, month, today.getDate()))
            }
        } else {
            setFirstDay(new Date(year, month, 1))
        }
    }, [showPast, year, month, isMobile, selectedDate])

    const firstDayOffsset = firstDay.getDay();

    if(!isMobile) {
        for (let i = 0; i < firstDayOffsset; i++) {
            calendarDays.push(
                <div key={`previous-${i}`} className="calendar-day empty offset-days" />
            );
        } 
    }

    //for desktop
    const [ openPopover, setOpenPopover ] = useState(null);
    const [ popoverEvents, setPopoverEvents ] = useState([]);

    //for mobile
    const [ expanded, setExpanded ] = useState(null);

    function handleDayClick(d, events) {
        if (isMobile) {
            setExpanded(expanded === d ? null : d)
        } else {
            handlePopover(d, events)
        }
    }

    function handlePopover(d, events) {        
        if (openPopover === d) {
            setOpenPopover(null);
            setPopoverEvents([]);
        } else {
            setOpenPopover(d);
            setPopoverEvents(events);
        }
    }

    const [ isExpanded, setIsExpanded ] = useState([]);

    function handleEventClick(id) {
        if (isExpanded.includes(id)) {
            setIsExpanded(prev => prev.filter(item => item !== id))
        } else {
            setIsExpanded(prev => [...prev, id])
        }
    }

    const calendarDay = (date, event) => {
        return (
            <div className='calendar-day-number'>
                <h4>{date}</h4>
                <span className='tag'>{formatEventDate(event.date, 'weekday')}</span> 
            </div>
        )
    }

    const firstEventDate = new Date(events[0].date).getDate();
    const lastEventDate = new Date(events[events.length - 1].date).getDate();

    //actual days 
    for (let d = firstDay.getDate(); d <= daysInMonth; d++) {
        const dayEvents = [];
        for (let i = 0; i < events.length; i++) {
            const eventDay = new Date(events[i].date).getDate();
            if (eventDay === d) {
                dayEvents.push(events[i]);
            } 
        }

        if (dayEvents.length >= 1) {

                if (isMobile) {
                    calendarDays.push(
                        <div key={d}
                            className={new Date(dayEvents[dayEvents.length - 1].date) < today ? 'calendar-day completed' : 'calendar-day'}
                            style= {{ anchorName: `--anchor${d}`}}
                            onClick={() => handleDayClick(d, dayEvents)}>
                            
                            {calendarDay(d, dayEvents[0])}

                            {dayEvents.map((event) => 
                                ( isExpanded.includes(event.id) ? (
                                    <div key={event.id} onClick={() => handleEventClick(event.id)}>
                                        <EventCalendarView
                                                event={event}
                                                today={today}
                                                />
                                    </div>
                                    
                                ) : (
                                    <div key={event.id} className="event" onClick={() => handleEventClick(event.id)}>
                                        <p className="body-large">{formatEventDate(event.date, 'time')}</p>
                                        <h5>{event.title}</h5>
                                    </div>
                                )))}
                        </div>
                    )
                } else {
                    calendarDays.push(
                        <div key={d}
                            className={new Date(dayEvents[dayEvents.length - 1].date) < today ? 'calendar-day completed' : 'calendar-day'}
                            style= {{ anchorName: `--anchor${d}`}}
                            onClick={() => handleDayClick(d, dayEvents)}>

                            {calendarDay(d, dayEvents[0])}
                            
                            <div className="event">
                                <p className="body-large">{formatEventDate(dayEvents[0].date, 'time')}</p>
                                <h5>{dayEvents[0].title}</h5>
                            </div>
                            { dayEvents.length > 1 ? (<span className='tag'> + {dayEvents.length - 1} more</span>) : null}
                        </div>
                )}
        } 
        else {
            if (isMobile && (d < firstEventDate - 2 || d > lastEventDate + 2)) {
                <></>
            } else if (isMobile && (d === firstEventDate - 2 || d === lastEventDate + 2)) {
                calendarDays.push(
                        <div key={d} className="calendar-day empty">
                            <h4>...</h4>
                        </div>
                    )
            } else {
                calendarDays.push(
                        <div key={d} className="calendar-day empty">
                            <h4>{d}</h4>
                        </div>
                    )
            }
                
            
            
        }
    }

    return (
        <>
            <section className="calendar">
                {weekdayLabels}
                {calendarDays}
            </section>
            <section className='popover-wrapper'>
                { openPopover && !isMobile ? (
                <>
                    <div className='backdrop-popover' onClick={() => setOpenPopover(null)}/>
                    <div
                        className='calendar-day-popover'
                        style={{ positionAnchor: `--anchor${openPopover}` }}
                        onMouseLeave={() =>setOpenPopover(null) }
                        >
                            {calendarDay(openPopover, popoverEvents[0])}
                            {popoverEvents.map((event) => (
                                <EventCalendarView
                                    key={event.id}
                                    event={event}
                                    today={today}
                                    />
                            ))}
                    </div>
                </>
                ) : (
                    null
                )}
            </section>
        </>
        
    )
}