import './Month.css'
import MonthListView from './month-view-components/MonthListView'
import MonthCalendarView from './month-view-components/MonthCalendarView'
import { useEffect, useState } from 'react'

export default function Month() {

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
    const [events, setEvents] = useState([]);
    
    useEffect(() => {
        async function fetchData() {
            try {
            const eventsData = await fetch(`/data/${year}-${month}.json`).then(res => res.json());

            const locationsData = await fetch('/data/locations.json').then(res => res.json());

            setEvents(eventsData.map(event => {
                const location = locationsData.find(location => location.key === event.locationKey)
                return {
                    ...event,
                    location: location,
                }
            }   
            )) } catch {
                setEvents([]);
            }
        }
        fetchData();
    }, [year, month]);

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
            <section className='events'>
                <section className='month-buttons'>
                    <button onClick={switchViews}>Switch to {isListView ? "Calendar" : "List"} view</button>
                    {/* <button disabled>Add to calendar</button> */}
                </section>
                { events.length > 0 ? <>{isListView ? <MonthListView events={events}/> : <MonthCalendarView events={events} selectedDate={selectedDate}/>}</> : null}
            </section>
        </article>
        
    )
}