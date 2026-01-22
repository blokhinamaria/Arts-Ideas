import { useState, useEffect } from 'react';
//Cloudinary
import { AdvancedImage } from '@cloudinary/react';
import { Cloudinary, CloudinaryImage } from "@cloudinary/url-gen";
import { scale } from '@cloudinary/url-gen/actions/resize';

//componenet
import EventCard, { type EventType } from './event-components/EventCard';
import Location from './event-components/EventLocation.js';

//utils
import { formatEventDate } from './utilities/FormatEventDate'
import './UpcomingEvents.css';

export default function UpcomingEvents() {
    const [ currentEvents, setCurrentEvents ] = useState<EventType[]>([]);
    const [ isLoading, setIsLoading ] = useState<boolean>(false)
    const [ error, setError ] = useState<string>('')

    const cloudinary = new Cloudinary({
        cloud: {
            cloudName: 'ded4glttn'
        }
    });

    useEffect(():void => {
        async function fetchCurrentEvents() {
            try {
                setIsLoading(true)
                const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3000' : ''
                const response:Response = await fetch(`${API_BASE_URL}/api/events/upcoming`)

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
                setIsLoading(false)
            }
        }
        fetchCurrentEvents();

    }, [])

    //media query
    function useMediaQuery(query:string):boolean {
        const [ matches, setMatches ] = useState<boolean>(false)

        useEffect(() => {
            const mediaQuery = window.matchMedia(query);
            const checkQuery = ():void => setMatches(mediaQuery.matches)

            checkQuery();

            mediaQuery.addEventListener('change', checkQuery)

            return ():void => mediaQuery.removeEventListener('change', checkQuery)
        }, [query])

        return matches;
    }

    const isNarrow:boolean = useMediaQuery('(max-width: 1024px)')

    const [ openPopover, setOpenPopover ] = useState<EventType|null>(null);

    if (isLoading) {
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

    const firstEventImage:CloudinaryImage = cloudinary
        .image(currentEvents[0]?.img_id ? currentEvents[0]?.img_id : 'default_fzyquk')
        .format('auto')
        .quality('auto')
        .resize(scale().width(1200));

    const secondEventImage:CloudinaryImage = cloudinary
        .image(currentEvents[1]?.img_id ? currentEvents[1]?.img_id : 'default_fzyquk')
        .format('auto')
        .quality('auto')
        .resize(scale().width(1200));

    const thirdEventImage:CloudinaryImage = cloudinary
        .image(currentEvents[2]?.img_id ? currentEvents[2]?.img_id : 'default_fzyquk')
        .format('auto')
        .quality('auto')
        .resize(scale().width(1200));

    return (
        <article id='upcoming-events'>
            <h1>Upcoming<br/>Events</h1>
            <section className='upcoming-events'>
                <div className={isNarrow ? 'following-event' : 'next-event'}>
                    <div className='event-image-container'>
                        <AdvancedImage cldImg={firstEventImage}/>
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
                    {/* <EventCard event={currentEvents[0]} /> */}
                        {/* <button disabled>Add to calendar</button> */}
                    </div>
                </div>

                <div className='following-event' onClick={!isNarrow ? () => setOpenPopover(currentEvents[1]) : undefined}>
                        <div className='event-image-container'>
                                <AdvancedImage cldImg={secondEventImage}/>
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

                <div className='following-event' onClick={!isNarrow ? () => setOpenPopover(currentEvents[2]) : undefined}>
                        <div className='event-image-container'>
                            <AdvancedImage cldImg={thirdEventImage}/>
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
                        onMouseLeave={() => setOpenPopover(null) }
                        >
                            <EventCard key={openPopover.id} event={openPopover}/>   
                    </div>
                </>
                ) : (
                    null
                )}
            </section>
        </article>
    )
}