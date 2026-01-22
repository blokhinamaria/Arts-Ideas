import './Month.css'
import MonthListView from './month-view-components/MonthListView'
import MonthCalendarView from './month-view-components/MonthCalendarView'
import { useEffect, useState, useLayoutEffect, useRef } from 'react'
import { hasEventPassed } from './utilities/HasEventPassed'
import { type EventType } from './event-components/EventCard'

export default function Month() {
    
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('')
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const monthName:string = new Intl.DateTimeFormat("en-US", {
        month: "long",
    }).format(selectedDate); 

    const year:number = selectedDate.getFullYear();
    const monthNumber:string = (selectedDate.getMonth() + 1).toString().padStart(2, '0');

    const availableMonths:string[] = ["2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-08"]

    // disable the buttons
    const disableNext:boolean = availableMonths.indexOf(`${year}-${monthNumber}`) === availableMonths.length - 1;
    const disablePrev:boolean = availableMonths.indexOf(`${year}-${monthNumber}`) === 0;

    const [ userSwitchedMonths, setUserSwitchedMonths ] = useState<boolean>(false)
    
    //select another month
    function handleNextMonth(needScrollTo:boolean):void {
        const index:number = availableMonths.indexOf(`${year}-${monthNumber}`);
        if (index !== -1 && index < availableMonths.length - 1) {
            setUserSwitchedMonths(needScrollTo)
            const [ year, month ]:string[] = availableMonths[index + 1].split('-')
            setSelectedDate(new Date(Number(year), Number(month) - 1))
        } else {
            showDefaultAvailableMonth()
        }
    }

    function handlePreviousMonth():void {
        const index:number = availableMonths.indexOf(`${year}-${monthNumber}`);
        if (index > 0 && index <= availableMonths.length - 1) {
            setUserSwitchedMonths(true)
            const [ year, month ]:string[] = availableMonths[index - 1].split('-')
            setSelectedDate(new Date(Number(year), Number(month) - 1));
        } else {
            showDefaultAvailableMonth();
        }
    }

    function showDefaultAvailableMonth() {
        setError('')
        if (availableMonths.length === 0) {
            setError('No events available')
        }
        const today:Date = new Date();
        const currentYear:number = today.getFullYear();
        const firstAvailableMonth:string|undefined = availableMonths.find((date:string):boolean => date.startsWith(currentYear.toString()))
        if (firstAvailableMonth) {
            const [ year, month ]:string[] =firstAvailableMonth.split('-')
            setSelectedDate(new Date(Number(year), Number(month) - 1))
        } else {
            const [ year, month ]:string[] = availableMonths[0].split('-')
            setSelectedDate(new Date(Number(year), Number(month) - 1))
        }
    }

    //switch views
    const [isListView, setIsListView] = useState<boolean>(true);

    function switchViews():void {
        setIsListView(prev => !prev)
    }

    //import data
    const [ events, setEvents ] = useState<EventType[]>([]);
    const [ upcomingEventsOnly, setUpcomingEventsOnly ] = useState<EventType[]|null>([]);
    
    const [ showPastButton, setShowPastButton ] = useState<boolean>(false); //showPastButton is only visible for the current month
    const [ showPast, setShowPast ] = useState<boolean>(false); //show or hide past events
    
    const today:Date = new Date();
    
    //fetch and set events data
    useEffect(() => {
        async function fetchEvents():Promise<void> {
            try {
                setIsLoading(true)
                const data:EventType[] = await fetchData();
                setEvents(data);
                
                //Is it current month?
                if (today.getMonth() === selectedDate.getMonth()) {
                    //Does the current month have events that passed?
                    const hasPastEvents:boolean = data.some((event:EventType):boolean => hasEventPassed(event.dates)) 
                    if (hasPastEvents) {
                        //filter upcoming events from passed events
                        const filteredData:EventType[] = data.filter((event:EventType):boolean => !hasEventPassed(event.dates))
                        //Does the current month have upcoming events?
                        if (filteredData.length > 0) {
                            setUpcomingEventsOnly(filteredData)
                            setShowPastButton(true)
                            setShowPast(false)
                            return 
                        } else {
                            //No upcoming events in the current month
                            //Has user navigated to this month?
                            if (userSwitchedMonths) {
                                setUpcomingEventsOnly(null)
                                setShowPastButton(false)
                                setShowPast(true)
                                return
                            }
                            //Navigate to the next month on the first render
                            handleNextMonth(false)
                            return
                        }
                    }
                    //current months has only upcoming events === treat is as a regular month
                }
                setUpcomingEventsOnly(null)
                setShowPastButton(false)
                setShowPast(true)
            } catch (err) {
                console.log(`Failed to fetch events: ${err}`)
                setError('Something went wrong. Please try again later')
            } finally {
                setIsLoading(false)
            }
        }
        fetchEvents();
    }, [year, monthNumber, selectedDate]);

    async function fetchData():Promise<EventType[]> {
        try {
            const response = await fetch(`/api/events?month=${monthNumber}&year=${year}`)
            if (!response.ok) {
                setError('No events found')
                return []
            }

            const data:EventType[] = await response.json()
            return data

        } catch (err) {
            console.log(`Failed to fetch events: ${err}`)
            return []
        }
    }

    //scrolling effect
    const imageRef = useRef<HTMLElement|null>(null)
    const sectionRef = useRef<HTMLElement|null>(null)
    
    useLayoutEffect(() => {
        if (userSwitchedMonths) {
            if (imageRef.current) {
            imageRef.current.scrollIntoView({
                behavior: 'smooth', // For a smooth animated scroll
                block: 'start',
                });
            }
            if (sectionRef.current) {
        sectionRef.current.scrollIntoView({
            behavior: 'smooth', // For a smooth animated scroll
            block: 'center',
            inline: "nearest"      // Aligns the top of the element to the top of the visible area
            });
        }
        }
    }, [isLoading, selectedDate])

    return (
        <article id='month' ref={imageRef}>
            <section className="month-title-banner">
                <div>
                    <button onClick={handlePreviousMonth} disabled={disablePrev} className='month-swipe'><span className="material-symbols-outlined">keyboard_double_arrow_left</span></button>
                    <div className='month-name-container'>
                        <h1 className='month-name'>{monthName}</h1>
                        <div className='month-name-details'>
                            <h2>Events</h2>
                            <h4>{year}</h4>
                        </div>
                    </div>
                    <button onClick={() => handleNextMonth(true)} disabled={disableNext} className='month-swipe'><span className="material-symbols-outlined">keyboard_double_arrow_right</span></button> 
                </div>
            </section>
            <div className='sticky-image'
                style={
                    {
                        backgroundImage: `url('/assets/img/${year}-${monthNumber}.jpg')`
                    }
                }>
            </div>
            {error || isLoading ? 
                <section className='events'>
                    <section className='month-buttons'>
                        <p>{error || isLoading}</p>
                    </section>
                </section>
                : 
                <section className='events'>
                    <section className='month-buttons' ref={sectionRef}>
                        <button onClick={switchViews}>Switch to {isListView ? "Calendar" : "List"} view</button>
                        {showPastButton && <button onClick={() => setShowPast(prev => !prev)}>{showPast ? 'Hide' : 'Show'} past events</button>}
                        {/* <button disabled>Add to calendar</button> */}
                    </section>
                    { events.length > 0 ? 
                        <>
                            {isListView ? 
                                <MonthListView events={
                                    showPast ?
                                        events
                                        : 
                                            upcomingEventsOnly && upcomingEventsOnly.length > 0 ?
                                                upcomingEventsOnly
                                                :
                                                events
                                        }/>
                                : 
                                <MonthCalendarView
                                    events={
                                        showPast ?
                                            events
                                            :
                                            upcomingEventsOnly && upcomingEventsOnly.length > 0 ?
                                                upcomingEventsOnly
                                                :
                                                events
                                        }
                                    selectedDate={selectedDate}
                                    showPast={showPast}
                                    />}
                        </>
                        :
                        null}
                </section>
            }
        </article>
        
    )
}