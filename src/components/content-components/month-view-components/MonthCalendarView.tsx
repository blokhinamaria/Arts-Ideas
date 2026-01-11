import './MonthCalendarView.css';

import { formatEventDate } from '../utilities/FormatEventDate';
import { ReactNode, useEffect, useState, type JSX } from 'react';

import EventCard, { type EventType, EventDateType} from '../event-components/EventCard';
import EventCardCalendarView from '../event-components/EventCardCalendarView';
import EventDate from '../event-components/EventDate';
import EventTitleGroup from '../event-components/EventTitleGroup';

type MonthCalendarView = {
    events: EventType[],
    selectedDate: Date,
    showPast:boolean
}

export default function MonthCalendarView({events, selectedDate, showPast}:MonthCalendarView) {

    //use MediaQuesry to identify the screen size
    function useMediaQuery(query:string):boolean {
        const [ matches, setMatches ] = useState<boolean>(false);

        useEffect(() => {
            const mediaQuery = window.matchMedia(query)
            const checkQuery = ():void => setMatches(mediaQuery.matches)

            checkQuery();

            mediaQuery.addEventListener('change', checkQuery)

            return () => mediaQuery.removeEventListener('change', checkQuery)
        }, [query])

        return matches;
    }

    const isMobile:boolean = useMediaQuery('(max-width: 768px')

    //expanded events on mobile
    const [ expandedDays, setExpandedDays ] = useState<number[]>([]);
    const [ expandedEventIds, setExpandedEventIds ] = useState<number[]>([]);
    
    function handleEventClick(e: MouseEvent, id:number) {
        e.stopPropagation()
        if (expandedEventIds.includes(id)) {
            setExpandedEventIds((prev:number[]):number[] => prev.filter((item:number):boolean => item !== id))
        } else {
            setExpandedEventIds((prev:number[]):number[] => [...prev, id])
        }
    }

    function handleDayClick(d:number, events:EventType[]) {
        if (isMobile) {
            if (expandedDays.includes(d)) {
                setExpandedDays((prev:number[]):number[] => prev.filter((day:number):boolean => day !== d))
                events.forEach((event:EventType):void => {
                    if (expandedEventIds.includes(event.id)) {
                        setExpandedEventIds((prev:number[]):number[] => prev.filter((id:number):boolean => id !== event.id))
                    }
                })
            } else {
                setExpandedDays((prev:number[]):number[] => [...prev, d])
                events.forEach((event:EventType):void => {
                    if (!expandedEventIds.includes(event.id)) {
                        setExpandedEventIds((prev:number[]):number[] => [...prev, event.id])
                    }
                })
            }
        } else {
            handlePopover(d, events)
        }
    }

    //expanding events on desktop
    const [ openPopover, setOpenPopover ] = useState<number|null>(null);
    const [ popoverEvents, setPopoverEvents ] = useState<EventType[]>([]);

    function handlePopover(d:number, events:EventType[]) {        
        if (openPopover === d) {
            setOpenPopover(null);
            setPopoverEvents([]);
        } else {
            setOpenPopover(d);
            setPopoverEvents(events);
        }
    }

    //build calendar
    const today:Date = new Date();

    const year:number = selectedDate.getFullYear();
    const month:number = selectedDate.getMonth();

    const weekdays:string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    const weekdayLabels:JSX.Element[] = weekdays.map((day:string):JSX.Element => (
        <div key={day} className="calendar-day day-of-week"><h5>{day}</h5></div>
    ))

    const calendarDays:ReactNode[] = [];

    //empty lots before the first day
    const [ firstDay, setFirstDay ] = useState<Date>(new Date(year, month, 1));

    useEffect(() => {
        if (today.getMonth() !== selectedDate.getMonth()) {
            setFirstDay(new Date(year, month, 1));
            return;
        }
        //hide the past events for the current month
        if (!showPast) {
            const dayOfWeek:number = today.getDay();
            if (dayOfWeek !== 0 && !isMobile) {
                const dayOfMonth:number = today.getDate();
                const sundayDate:number = dayOfMonth - dayOfWeek;
                setFirstDay(new Date(year, month, sundayDate));
            } else {
                setFirstDay(new Date(year, month, today.getDate()))
            }
        } else {
            setFirstDay(new Date(year, month, 1))
        }
    }, [showPast, year, month, isMobile, selectedDate])

    const firstDayOffsset:number = firstDay.getDay();

    //ignore offset days on mobile
    if(!isMobile) {
        for (let i = 0; i < firstDayOffsset; i++) {
            calendarDays.push(
                <div key={`previous-${i}`} className="calendar-day empty offset-days" />
            );
        } 
    }

    const calendarDayHeader = (day:number, date:string):ReactNode => {
        return (
            <div className='calendar-day-number'>
                <h4>{day}</h4>
                <span key={date} className='tag'>{formatEventDate(date, 'weekday')}</span> 
            </div>
        )
    }

    const firstEventDate:number = new Date(events[0].dates[0].start_date).getDate();
    const lastEventIndex:number = events.length - 1;
    const lastEventLastDateIndex:number = events[lastEventIndex].dates.length - 1
    const lastEventDate:number = new Date(events[lastEventIndex].dates[lastEventLastDateIndex].start_date).getDate();

    const daysInMonth:number = new Date(year, month + 1, 0).getDate();

    //build calendar days 
    for (let d = firstDay.getDate(); d <= daysInMonth; d++) {
        const dayEvents:EventType[] = [];
        
        //find events of the day
        events.forEach((event:EventType):void => (
            event.dates.forEach((date:EventDateType):void => {
                const eventDay = new Date(date.start_date).getDate();
                if (eventDay === d) {
                    dayEvents.push(event);
                } 
            })
        ))

        //display events
        if (dayEvents.length >= 1) {
            //show all events on mobile
            if (isMobile) {
                calendarDays.push(
                    <div key={d}
                        className={new Date(dayEvents[dayEvents.length - 1].dates[dayEvents[dayEvents.length - 1].dates.length - 1].start_date) < today ? 'calendar-day completed' : 'calendar-day'}
                        style= {{ anchorName: `--anchor${d}`}}
                        onClick={() => handleDayClick(d, dayEvents)}>
                        
                        { calendarDayHeader(d, dayEvents[0].dates[0].start_date) }

                        { dayEvents.map((event:EventType, index:number):JSX.Element => 
                            <div key={event.id} onClick={(e) => handleEventClick(e, event.id)}>
                                { index > 0 && <hr/>}
                                { expandedEventIds.includes(event.id) ? (

                                        <EventCardCalendarView
                                            event={event}
                                            />
                                ) : (
                                    <>
                                        {event.dates.map((date:EventDateType):JSX.Element => 
                                            <EventDate date={date} format='time'/>  
                                        )}
                                        <EventTitleGroup title={event.title}/>
                                    </>
                                )}
                            </div>
                            
                            )
                        }
                    </div>
                )
            } else {
                //show only the first event on desktop
                calendarDays.push(
                    <div key={d}
                        className={new Date(dayEvents[dayEvents.length - 1].dates[dayEvents[dayEvents.length - 1].dates.length - 1].start_date) < today ? 'calendar-day completed' : 'calendar-day'}
                        style= {{ anchorName: `--anchor${d}`}}
                        onClick={() => handleDayClick(d, dayEvents)}>

                        { calendarDayHeader(d, dayEvents[0].dates[0].start_date) }
                        
                        <div className="event">
                            <p className="body-large">{formatEventDate(dayEvents[0].dates[0].start_date, 'time')}</p>
                            <EventTitleGroup title={dayEvents[0].title}/>
                        </div>
                        { dayEvents.length > 1 ? (<span className='tag'> + {dayEvents.length - 1} more</span>) : null}
                    </div>
            )}
        } else {
            //days with no events
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
                            className='calendar-day-popover anchored'
                            style={{ positionAnchor: `--anchor${openPopover}` }}
                            onMouseLeave={() => setOpenPopover(null) }
                            >
                                { calendarDayHeader(openPopover, popoverEvents[0].dates[0].start_date) }
                                { popoverEvents.map((event) => (
                                    <EventCardCalendarView
                                        key={event.id}
                                        event={event}
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