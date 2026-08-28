import './Month.css'
import MonthListView from './month-view-components/MonthListView'
import MonthCalendarView from './month-view-components/MonthCalendarView'
import { useEffect, useState, useLayoutEffect, useRef, useMemo } from 'react'
import { hasEventPassed } from './utilities/HasEventPassed'
import { type EventType } from './event-components/EventCard'
import { Cloudinary, CloudinaryImage } from "@cloudinary/url-gen";
import { scale } from '@cloudinary/url-gen/actions/resize';
import { quality } from '@cloudinary/url-gen/actions/delivery';
import { auto } from '@cloudinary/url-gen/qualifiers/quality';

const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3000' : ''

type AvailableMonths = Record<string, number[]>
type Image = {
    public_id?: string,
    url?: string
}

// TODO
// handle monthsLoadingError
// load months images from cloudinary (:check)
// create context
// store loaded data to avoid refetching

export default function Month() {
    
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('')
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const [ availableMonths, setAvailableMonths ] = useState<AvailableMonths>({})
    const [ monthsLoadingError, setMonthsLoadingError ] = useState('')

    const cloudinary = new Cloudinary({
        cloud: {
            cloudName: 'ded4glttn'
        }
    });

    const monthName:string = new Intl.DateTimeFormat("en-US", {
        month: "long",
    }).format(selectedDate); 

    const year:number = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1
    const monthDoubleDigitNumber:string = (selectedDate.getMonth() + 1).toString().padStart(2, '0');

    // disable the buttons
    const disableNext:boolean = !hasNextMonth()
    const disablePrev:boolean = !hasPreviousMonth()

    function hasNextMonth() {
        if (availableMonths[year]) {
            const currentMonthIndex = availableMonths[year].indexOf(month)
            if (currentMonthIndex === availableMonths[year].length - 1) { //last month in this year, check next year 
                if (availableMonths[year + 1]) { //next year is available, grab the first month
                    const nextAvailableMonth = availableMonths[year + 1][0]
                    if (nextAvailableMonth) return true
                } else { //next year is not avalable
                    return false
                }
            } else { //not last month in the year
                return true
            }
        }
        return false
    }

    function hasPreviousMonth() {
        if (availableMonths[year]) {
            const currentMonthIndex = availableMonths[year].indexOf(month)
            if (currentMonthIndex === 0) { //first month in this year, check prev year
                if (availableMonths[year - 1]) { //next year is available, grab the first month
                    const nextAvailableMonth = availableMonths[year - 1][0]
                    if (nextAvailableMonth) return true
                } else { //prev year is not avalable
                    return false
                }
            } else { //not first month in the year
                return true
            }
        }
        return false
    }

    const [ userSwitchedMonths, setUserSwitchedMonths ] = useState<boolean>(false)
    
    //select another month
    function handleNextMonth(availableMonths: AvailableMonths, selectedYear:number, selectedMonth:number):Date | null {
        // assumption that every year exists in the object!

        // get current month index
        const index:number = availableMonths[selectedYear].indexOf(selectedMonth);
        
        //current month doesn't exist in the array, check for next closest month
        if (index === -1) {
            for (const availableMonth of availableMonths[selectedYear]) {
                if (availableMonth > selectedMonth) {
                    return new Date(Number(selectedYear), Number(availableMonth) - 1)
                }
            }
        // it's not the last month of the year array, get the next month
        } else if (index < availableMonths[year].length - 1) {
            const newMonth = availableMonths[selectedYear][index + 1]
            if (newMonth) return new Date(Number(selectedYear), Number(newMonth) - 1)
        // it's the last month of the year, check if next year is available
        } else if (availableMonths[selectedYear + 1]) {
            const newMonth = availableMonths[selectedYear + 1]?.[0]
            if (newMonth) return new Date(Number(selectedYear + 1), Number(newMonth) - 1)
        }
        return null
    }

    function handlePreviousMonth(availableMonths: AvailableMonths, selectedYear:number, selectedMonth:number):Date | null  {
        // get current month index
        const index:number = availableMonths[selectedYear].indexOf(selectedMonth);

       //current month doesn't exist in the array, check for previous closest month
        if (index === -1) {
            const reversedMonthArray = [...availableMonths[selectedYear]].reverse()
            for (const availableMonth of reversedMonthArray) {
                if (availableMonth < selectedMonth) {
                    return new Date(Number(selectedYear), Number(availableMonth) - 1)
                }
            }
        // it's not the first month of the year array, get previous month
        } else if (index !== 0) {
            const newMonth = availableMonths[selectedYear][index - 1]
            if (newMonth) return new Date(Number(selectedYear), Number(newMonth) - 1)
        // it's the first month of the year, check if prev year is available
        } else if (availableMonths[selectedYear - 1]) {
            const previousYearArray =  availableMonths[selectedYear - 1]
            if (previousYearArray) {
                const newMonth = previousYearArray[previousYearArray.length - 1]
                if (newMonth) return new Date(Number(selectedYear - 1), Number(newMonth) - 1)
            }
        }
        return null
    }

    //switch views
    
    const [isListView, setIsListView] = useState<boolean>(true);

    function switchViews():void {
        setIsListView(prev => !prev)
    }

    //import events data

    const [ events, setEvents ] = useState<EventType[]>([]);
    const [ upcomingEventsOnly, setUpcomingEventsOnly ] = useState<EventType[]|null>([]);
    
    const [ showPastButton, setShowPastButton ] = useState<boolean>(false); //showPastButton is only visible for the current month
    const [ showPast, setShowPast ] = useState<boolean>(false); //show or hide past events

    const [ image, setImage ] = useState<CloudinaryImage | null>(null)
    
    const today:Date = useMemo(() => new Date(), []);
    
    //fetch and set events data
    useEffect(() => {
        async function buildEvents():Promise<void> {
            try {
                setIsLoading(true)
                let availableMonthsData = availableMonths
                if (Object.keys(availableMonthsData).length === 0) {
                    availableMonthsData = await fetchMonths()
                    setAvailableMonths(availableMonthsData)
                }

                // should be restractured to cache and store the events without fetching all the time
                const { events, image } = await fetchMonthEvents();
                const allMonthlyEvents:EventType[] = events.flatMap(e => {
                    if (e.dates.length === 1) return [e]
                    let result = []
                    for (let i = 0; i < e.dates.length; i++) {
                        result.push({
                        ...e, 
                        dates: e.dates.slice(i)
                        })
                    }
                    return result
                    }
                )
                
                setEvents(allMonthlyEvents);
                
                const cloudImage: CloudinaryImage = cloudinary
                    .image(image.public_id)
                    .resize(scale().width(2880))
                    .delivery(quality(auto()));
                
                setImage(cloudImage)
                
                //Is it current month?
                if (today.getMonth() === selectedDate.getMonth()) {
                    //Does the current month have events that passed?
                    const hasPastEvents:boolean = allMonthlyEvents.some((event:EventType):boolean => hasEventPassed(event.dates)) 
                    if (hasPastEvents) {
                        //filter upcoming events from passed events
                        const filteredData:EventType[] = allMonthlyEvents.filter((event:EventType):boolean => !hasEventPassed(event.dates))
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
                            //get next month on the first render
                            const nextAvailableDate = handleNextMonth(availableMonthsData, year, month)

                            if (nextAvailableDate) {
                                setSelectedDate(nextAvailableDate)
                                setUserSwitchedMonths(false)
                                return
                            }
                        }
                    }
                    //current months has only upcoming events === treat is as a regular month
                }
                setUpcomingEventsOnly(null)
                setShowPastButton(false)
                setShowPast(true)
            } catch {
                setError('Something went wrong. Please try again later')
            } finally {
                setIsLoading(false)
            }}

            buildEvents()
        
    }, [availableMonths, year, monthDoubleDigitNumber, selectedDate]);

    async function fetchMonths() {
            setIsLoading(true)
            try {
                const response = await fetch(`${API_BASE_URL}/api/events/all-dates`)

                if (!response.ok) {
                    setMonthsLoadingError('Failed to load data. Please try again later')
                    return
                }

                const data = await response.json()
                return data
            } catch {
                setMonthsLoadingError('Failed to load data. Please try again later')
                return []
            }
        }

    async function fetchMonthEvents():Promise<{events: EventType[], image:Image}> {
        try {
            
            const response = await fetch(`${API_BASE_URL}/api/events?month=${monthDoubleDigitNumber}&year=${year}`)
            if (!response.ok) {
                setError('No events found')
                return {events: [], image: {}}
            }

            const data = await response.json()
            return data

        } catch {
            return {events: [], image: {}}
        }
    }

    function handleMonthSwitch(direction:string) {
        const newDate = direction === 'next' 
            ? handleNextMonth(availableMonths, year, month)
            : handlePreviousMonth(availableMonths, year, month)
        if (newDate) {
            setSelectedDate(newDate)
            if (!userSwitchedMonths) setUserSwitchedMonths(true)
        }
        return
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
        <article id='month' ref={imageRef} className={`${image ? '' : 'no-image'}`}>
            <section className="month-title-banner">
                <div>
                    <button
                        onClick={() => handleMonthSwitch('previous')}
                        disabled={disablePrev}
                        className='month-swipe'
                        aria-label='Previous month'
                        >
                            <span className="material-symbols-outlined">keyboard_double_arrow_left</span>
                    </button>
                    <div className='month-name-container'>
                        <span className="subtitle">Events</span>
                        <h2 className='month-name article-title'>{monthName}</h2>
                        <span className="date">{year}</span>
                    </div>
                    <button
                        onClick={() => handleMonthSwitch('next')}
                        disabled={disableNext}
                        className='month-swipe'
                        aria-label='Next month'
                        >
                            <span className="material-symbols-outlined">keyboard_double_arrow_right</span>
                    </button> 
                </div>
            </section>
            {image && <div className='sticky-image'
                style={
                    {
                        backgroundImage: `url(${image ? image.toURL() : ''})`,
                    }
                }>
            </div>}
            {error || isLoading ? 
                <section className='events'>
                    <section className='month-buttons'>
                        <p>{error || isLoading}</p>
                    </section>
                </section>
                : 
                <section className={`${image ? 'events with-image' : 'events'}`}>
                    <section className='month-buttons' ref={sectionRef}>
                        <button onClick={switchViews}>Switch to {isListView ? "Calendar" : "List"} view</button>
                        {showPastButton && <button onClick={() => setShowPast(prev => !prev)}>{showPast ? 'Hide' : 'Show'} past events</button>}
                        {/* <button disabled>Add all to calendar</button> */}
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
