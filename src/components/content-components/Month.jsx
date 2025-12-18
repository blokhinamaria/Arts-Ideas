import './Month.css'
import MonthListView from './month-view-components/MonthListView'
import MonthCalendarView from './month-view-components/MonthCalendarView'
import { useEffect, useState } from 'react'

export default function Month() {
    
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState(new Date());

    const month = new Intl.DateTimeFormat("en-US", {
        month: "2-digit",
    }).format(selectedDate);

    const monthName = new Intl.DateTimeFormat("en-US", {
        month: "long",
    }).format(selectedDate); 

    const year = selectedDate.getFullYear();

    //filter unavailable months
    const [availableMonths, setAvailableMonths] = useState([]);

    useEffect(() => {
        async function fetchAvailableMonths() {
            const monthsData = await fetch(`/data/available-months.json`).then(res => res.json());
            setAvailableMonths(monthsData);
        }
        fetchAvailableMonths();
        
    }, []);

    // disable the buttons
    const disableNext = availableMonths.indexOf(`${year}-${month}`) === availableMonths.length - 1;
    const disablePrev = availableMonths.indexOf(`${year}-${month}`) === 0;
    
    //select another month
    function handleNextMonth() {
        const index = availableMonths.indexOf(`${year}-${month}`);

        if (index !== -1 && index < availableMonths.length - 1) {
            const [ year, month ] = availableMonths[index + 1].split('-')
            setSelectedDate(new Date(Number(year), Number(month) - 1))
        } 
    }

    function handlePreviousMonth() {
        const index = availableMonths.indexOf(`${year}-${month}`);

        if (index > 0) {
            const [ year, month ] = availableMonths[index - 1].split('-')
            setSelectedDate(new Date(Number(year), Number(month) - 1));
        }
    }

    //switch views
    const [isListView, setIsListView] = useState(true);

    function switchViews() {
        setIsListView(prev => !prev)
    }

    //import data
    const [ events, setEvents ] = useState([]);
    const [ upcomingEventsOnly, setUpcomingEventsOnly ] = useState([]);
    const [ showPast, setShowPast ] = useState(false);
    const [ isCurrentMonth, setIsCurrentMonth ] = useState(false);
    const today = new Date();
    const cutOffTime = today.setMinutes(today.getMinutes() - 45);

    const [error, setError] = useState('')
    
    useEffect(() => {
        async function fetchEvents() {
            try {
                setLoading(true)
                const data = await fetchData();
                setEvents(data);
                
                if (today.getMonth() === selectedDate.getMonth()) {
                    const filteredData = data.filter(event => (
                        event.dates.some(date => 
                            new Date(date.start_date) >= cutOffTime)
                            )
                        )
                    if (filteredData.length === 0) {
                        setUpcomingEventsOnly(null)
                        setIsCurrentMonth(false)
                        setShowPast(true)
                        return
                    }
                    setUpcomingEventsOnly(filteredData)
                    setIsCurrentMonth(true)
                    setShowPast(false)

                } else {
                    setUpcomingEventsOnly(null)
                    setIsCurrentMonth(false)
                    setShowPast(true)
                }
            } catch (err) {
                console.log(`Failed to fetch events: ${err}`)
                setError('Something went wrong. Please try again later')
            } finally {
                setLoading(false)
            }
        }
        
        fetchEvents();
    }, [year, month, selectedDate]);

    async function fetchData() {
        try {
            const API_URL = import.meta.env.VITE_API_URL;
            const response = await fetch(`${API_URL}/api/events?month=${month}&year=${year}`)
            if (!response.ok) {
                setError('No events found')
                return
            }

            const data = await response.json()
            return data

        } catch (err) {
            console.log(`Failed to fetch events: ${err}`)
            return []
        }
    }

    return (

        <article id='month'>
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
                    <button onClick={handleNextMonth} disabled={disableNext} className='month-swipe'><span className="material-symbols-outlined">keyboard_double_arrow_right</span></button> 
                </div>
            </section>
            <div className='sticky-image'
                style={
                    {
                        backgroundImage: `url('/assets/img/${year}-${month}.jpg')`
                    }
                }>
            </div>
            {error || loading ? 
                <section className='events'>
                    <section className='month-buttons'>
                        <p>{error || loading}</p>
                    </section>
                </section>
                : 
                <section className='events'>
                    <section className='month-buttons'>
                        <button onClick={switchViews}>Switch to {isListView ? "Calendar" : "List"} view</button>
                        {isCurrentMonth && <button onClick={() => setShowPast(prev => !prev)}>{showPast ? 'Hide' : 'Show'} past events</button>}
                        {/* <button disabled>Add to calendar</button> */}
                    </section>
                    { events.length > 0 ? <>{isListView ? <MonthListView events={showPast ? events : upcomingEventsOnly}/> : <MonthCalendarView events={showPast ? events : upcomingEventsOnly} selectedDate={selectedDate} showPast={showPast}/>}</> : null}
                </section>
            }
        </article>
        
    )
}