import './Month.css'
import MonthListView from './month-view-components/MonthListView'
import MonthCalendarView from './month-view-components/MonthCalendarView'
import { useEffect, useState } from 'react'

export default function Month() {
    
    //select month
    const [selectedDate, setSelectedDate] = useState(new Date());

    function handleNextMonth() {
        setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
    }

    function handlePreviousMonth() {
        setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1));
    }

    const month = new Intl.DateTimeFormat("en-US", {
        month: "2-digit",
    }).format(selectedDate);

    const monthName = new Intl.DateTimeFormat("en-US", {
        month: "long",
    }).format(selectedDate); 

    const year = selectedDate.getFullYear();

    //switch views
    const [isListView, setIsListView] = useState(true);

    function switchViews() {
        setIsListView(prev => !prev)
    }

    //import data
    const [events, setEvents] = useState([]);
    
    useEffect(() => {
        async function fetchData() {
            const eventsData = await fetch(`/data/${year}-${month}.json`).then(res => res.json());
            const locationsData = await fetch('/data/locations.json').then(res => res.json());

            setEvents(eventsData.map(event => {
                const location = locationsData.find(location => location.key === event.locationKey)
                return {
                    ...event,
                    location: location,
                }
            }   
            ))
        }
        fetchData();
    }, [year, month]);

    return (

        <article id='month'>
            <section className="month-title-banner">
                <button onClick={handlePreviousMonth} className='month-swipe disabled'><span className="material-symbols-outlined">keyboard_double_arrow_left</span></button>
                <div>
                    <h1>{monthName}</h1>
                    <h2>Events</h2>
                </div>
                <button onClick={handleNextMonth} className='month-swipe'><span className="material-symbols-outlined">keyboard_double_arrow_right</span></button> 
            </section>
            <div className='sticky-image'
                style={
                    {
                        backgroundImage: `url('/assets/img/hero-image-1.png')`
                    }
                }>
            </div>
            <section className='month-buttons'>
                <button onClick={switchViews}>Switch to {isListView ? "Calendar" : "List"} view</button>
                <button>Add to calendar</button>
            </section>
            { events.length > 0 ? <>{isListView ? <MonthListView events={events}/> : <MonthCalendarView events={events}/>}</> : null}
            
        </article>
        
    )
}