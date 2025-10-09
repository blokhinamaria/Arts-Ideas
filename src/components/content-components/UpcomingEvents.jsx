import { useState, useEffect } from 'react';
import './UpcomingEvents.css';
import { formatEventDate } from './utilities/FormatEventDate'


export default function UpcomingEvents() {
    const [ currentEvents, setCurrentEvents ] = useState([]);
    const [ availableMonths, setAvailableMonths ] = useState([]);

    useEffect(() => {
        async function fetchAvailableMonths() {
            const monthsData = await fetch(`/data/available-months.json`).then(res => res.json());
            setAvailableMonths(monthsData);
        }
        fetchAvailableMonths();
        
    }, []);

    useEffect(() => {
        const today = new Date();
        const year = today.getFullYear();
    
        const month = new Intl.DateTimeFormat("en-US", {
            month: "2-digit",
        }).format(today);
        
        async function fetchCurrentEvents() {
            try {
                // fetch current month events
                let upcomingEvents = await fetch(`/data/${year}-${month}.json`)
                    .then(res => res.json())
                    .then(data => data.filter(event => new Date(event.date) >= today));
                // if fewer than 3, try the next month
                if (upcomingEvents.length < 3) {
                        const index = availableMonths.indexOf(`${year}-${month}`);
                            if (index !== -1 && index < availableMonths.length) {
                                const [ nextYear, nextMonth ] = availableMonths[index + 1].split('-');
                                const nextEvents = await fetch(`/data/${nextYear}-${nextMonth}.json`)
                                    .then(res => res.json())
                                upcomingEvents = [...upcomingEvents, ...nextEvents];
                                }                        
                }
                
                upcomingEvents = upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3);

                 // attach locations
                const locationsData = await fetch('/data/locations.json').then(res => res.json());
                
                setCurrentEvents(upcomingEvents.map(event => {
                    const location = locationsData.find(location => location.key === event.locationKey)
                    return {
                        ...event, 
                        location: location,
                    }   
                }))
            } catch {
                console.error("Failed to fetch current events");
                setCurrentEvents([]);
            }
        }
        fetchCurrentEvents();

    }, [availableMonths])

    return (
        <article id='upcoming-events'>
            <h1>Upcoming<br/>Events</h1>
            <section className='upcoming-events'>

                <div className='next-event'>

                    <div className='next-event-image-container'>
                        <img src={currentEvents[0]?.coverImageUrl}></img>
                    </div>

                    <div className='next-event-details-container'>
                            <span className='tag tag-shape'>{currentEvents[0]?.category}</span>
                            <div className='next-event-description'>
                                <h5>{currentEvents[0]?.title}</h5>
                                <hr />
                                <div className='next-event-data-location-group'>
                                <p className='body-large'>{formatEventDate(currentEvents[0]?.date)}</p>
                                <p className='body-large'>{currentEvents[0]?.location?.venue}{currentEvents[0]?.location?.building ? <><br/>{currentEvents[0]?.location?.building}</> : ''}</p>
                                </div>
                                <p>{currentEvents[0]?.description}</p>
                            </div>
                            <button disabled>Add to calendar</button>
                    </div>

                </div>

                <div className='following-events'>
                    <div className='following-event'>
                            <div className='following-event-image-container'>
                                {currentEvents[1]?.coverImageUrl ? (<img src={currentEvents[1]?.coverImageUrl}></img>) : (<img src='/assets/img/default.jpg'></img>)}
                                
                            </div>

                            <div className='following-event-details-container'>
                                    <span className='tag tag-shape absolute'>{currentEvents[1]?.category}</span>
                                    <div className='following-event-description'>
                                        <h5>{currentEvents[1]?.title}</h5>
                                        <hr />
                                        <p className='body-large'>{formatEventDate(currentEvents[1]?.date)}</p>
                                        <p className='body-large'>{currentEvents[1]?.location?.venue}
                                            {currentEvents[1]?.location?.building ? <><br/>{currentEvents[1]?.location?.building}</> : ''}
                                        </p>
                                    </div>
                                    {/* <button className='add-to-calendar-icon'><span className="material-symbols-outlined">
                                        calendar_add_on
                                    </span></button> */}
                            </div>
                    </div>

                    <div className='following-event'>
                            <div className='following-event-image-container'>
                                <img src={currentEvents[2]?.coverImageUrl}></img>
                            </div>

                            <div className='following-event-details-container'>
                                    <span className='tag tag-shape absolute'>{currentEvents[2]?.category}</span>
                                    <div className='following-event-description'>
                                        <h5>{currentEvents[2]?.title}</h5>
                                        <hr />
                                        <p className='body-large'>{formatEventDate(currentEvents[2]?.date)}</p>
                                        <p className='body-large'>{currentEvents[2]?.location?.venue}
                                            {currentEvents[2]?.location?.building ? <><br/>{currentEvents[2]?.location?.building}</> : ''}
                                        </p>
                                    </div>
                                    {/* <button className='add-to-calendar-icon'><span className="material-symbols-outlined">
                                        calendar_add_on
                                    </span></button> */}
                            </div>
                    </div>
                </div>

            </section>
        </article>
    )
}