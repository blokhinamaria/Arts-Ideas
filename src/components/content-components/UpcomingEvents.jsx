import { useState, useEffect } from 'react';
import './UpcomingEvents.css';
import { formatEventDate } from './utilities/FormatEventDate'
import Event from './event-components/Event.jsx';
import Location from './event-components/Location.jsx';


export default function UpcomingEvents() {
    const [ currentEvents, setCurrentEvents ] = useState([]);
    const [loading, setLoading] = useState(false)
    const [ error, setError ] = useState('')

    useEffect(() => {
        
        async function fetchCurrentEvents() {
            try {
                setLoading(true)
                const API_URL = import.meta.env.VITE_API_URL;
                const response = await fetch(`${API_URL}/api/events/upcoming`)

                if (!response.ok) {
                    setError('Something went wrong')
                    return
                }

                const data = await response.json()
                setCurrentEvents(data)
                
            } catch {
                console.error("Failed to fetch current events");
                setCurrentEvents([]);
            } finally {
                setLoading(false)
            }
        }
        fetchCurrentEvents();

    }, [])

    //media query
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

    const isNarrow = useMediaQuery('(max-width: 1024px')

    const defaultImageSrc = './assets/img/default.jpg'

    const [ openPopover, setOpenPopover ] = useState(null);

    if (loading) {
        return (
            <p>Loading events...</p>
        )
    }

    if (error) {
        console.log(error)
        return (
            <></>
        )
    }

    return (
        <article id='upcoming-events'>
            <h1>Upcoming<br/>Events</h1>
            <section className='upcoming-events'>

                <div className={isNarrow ? 'following-event' : 'next-event'}>

                    <div className='event-image-container'>
                        <img
                            src={currentEvents[0]?.img_url}
                            onError={(e => e.target.src = defaultImageSrc)}
                            ></img>
                    </div>

                    <div className='event-details-container'>
                            <span className={isNarrow ? 'tag tag-shape absolute' : 'tag tag-shape'}>{currentEvents[0]?.category}</span>
                            <div className='event-description'>
                                <h5>{currentEvents[0]?.title}</h5>
                                <hr />
                                {
                                    currentEvents[0]?.dates.map(date => (
                                        <p key={`${currentEvents[0]?.id}${date.start_date}`} className='body-large'>{formatEventDate(date.start_date)}</p>
                                    ))
                                }
                                <Location location={currentEvents[0]?.location}/>
                                <p>{currentEvents[0]?.description}</p>
                            </div>
                            <div></div>
                            {/* <button disabled>Add to calendar</button> */}
                    </div>

                </div>

                    <div className='following-event' onClick={!isNarrow ? () => setOpenPopover(currentEvents[1]) : null}>
                            <div className='event-image-container'>
                                <img
                                    src={currentEvents[1]?.img_url}
                                    onError={(e => e.target.src = defaultImageSrc)}
                                    ></img>
                            </div>

                            <div className='event-details-container'>
                                    <span className='tag tag-shape absolute'>{currentEvents[1]?.category}</span>
                                    <div className='event-description'>
                                        <h5>{currentEvents[1]?.title}</h5>
                                        <hr />
                                        {
                                            currentEvents[1]?.dates.map(date => (
                                                <p key={`${currentEvents[1]?.id}${date.start_date}`} className='body-large'>{formatEventDate(date.start_date)}</p>
                                            ))
                                        }
                                        <Location location={currentEvents[1]?.location}/>
                                        {isNarrow ? <p>{currentEvents[1]?.description}</p> : null}
                                    </div>
                                    
                                    {/* <button className='add-to-calendar-icon'><span className="material-symbols-outlined">
                                        calendar_add_on
                                    </span></button> */}
                            </div>
                    </div>

                    <div className='following-event' onClick={!isNarrow ? () => setOpenPopover(currentEvents[2]) : null}>
                            <div className='event-image-container'>
                                <img
                                    src={currentEvents[2]?.img_url}
                                    onError={(e => e.target.src = defaultImageSrc)}
                                    ></img>
                            </div>

                            <div className='event-details-container'>
                                    <span className='tag tag-shape absolute'>{currentEvents[2]?.category}</span>
                                    <div className='event-description'>
                                        <h5>{currentEvents[2]?.title}</h5>
                                        <hr />
                                        {
                                            currentEvents[2]?.dates.map(date => (
                                                <p key={`${currentEvents[2]?.id}${date.start_date}`} className='body-large'>{formatEventDate(date.start_date)}</p>
                                            ))
                                        }
                                        <Location location={currentEvents[2]?.location}/>
                                        {isNarrow ? <p>{currentEvents[2]?.description}</p> : null} 
                                    </div>
                                    
                                    {/* <button className='add-to-calendar-icon'><span className="material-symbols-outlined">
                                        calendar_add_on
                                    </span></button> */}
                            </div>
                    </div>
            </section>
            <section className='popover-wrapper'>
                { openPopover && !isNarrow ? (
                <>
                    <div className='backdrop-popover' onClick={() => setOpenPopover(null)}/>
                    <div
                        className='calendar-day-popover'
                        onMouseLeave={() =>setOpenPopover(null) }
                        >
                            <Event key={openPopover.id} event={openPopover}/>   
                    </div>
                </>
                ) : (
                    null
                )}
            </section>
        </article>
    )
}