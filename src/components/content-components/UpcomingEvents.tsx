import { useState, useEffect, useRef } from 'react';
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
import EventDate from './event-components/EventDate.js';

function preloadImage(src:string):Promise<void> {
    return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => resolve()
        img.src = src
    })
}

function wait(ms:number):Promise<void> {
    return new Promise((resolve) => {
        window.setTimeout(resolve, ms)
    })
}

export default function UpcomingEvents() {
    const [ currentEvents, setCurrentEvents ] = useState<EventType[]>([]);
    const [ isLoading, setIsLoading ] = useState<boolean>(true)
    const [ error, setError ] = useState<string>('')
    const [ isLoaderVisible, setIsLoaderVisible ] = useState<boolean>(true)
    const [ isLoaderFading, setIsLoaderFading ] = useState<boolean>(false)

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
    const popoverRef = useRef<HTMLDivElement | null>(null)
    const triggerRef = useRef<HTMLDivElement | null>(null)
    const loaderStartRef = useRef<number>(performance.now())

    useEffect(() => {
        if (openPopover && popoverRef.current) {
            popoverRef.current.focus()
        }
        if (!openPopover && triggerRef.current) {
            triggerRef.current.focus()
        }
    }, [openPopover])

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
    
    const firstEventImageUrl:string = firstEventImage.toURL();
    const secondEventImageUrl:string = secondEventImage.toURL();
    const thirdEventImageUrl:string = thirdEventImage.toURL();

    useEffect(() => {
        if (error || isLoading || !isLoaderVisible) {
            return
        }

        let isCanceled:boolean = false
        let timeoutId:number | undefined

        async function finalizeLoadState():Promise<void> {
            const fontsReady:Promise<void> = document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve()
            const elapsed:number = performance.now() - loaderStartRef.current
            const minLoaderDelay:number = Math.max(0, 2000 - elapsed)

            await Promise.all([
                fontsReady,
                preloadImage('/assets/img/2025-09.jpg'),
                preloadImage(firstEventImageUrl),
                preloadImage(secondEventImageUrl),
                preloadImage(thirdEventImageUrl),
                wait(minLoaderDelay),
            ])

            if (isCanceled) {
                return
            }

            setIsLoaderFading(true)
            timeoutId = window.setTimeout(() => {
                if (!isCanceled) {
                    setIsLoaderVisible(false)
                }
            }, 450)
        }

        finalizeLoadState().catch(() => {
            if (isCanceled) {
                return
            }
            setIsLoaderFading(true)
            timeoutId = window.setTimeout(() => {
                if (!isCanceled) {
                    setIsLoaderVisible(false)
                }
            }, 450)
        })

        return () => {
            isCanceled = true
            if (timeoutId) {
                window.clearTimeout(timeoutId)
            }
        }
    }, [error, firstEventImageUrl, isLoading, isLoaderVisible, secondEventImageUrl, thirdEventImageUrl])

    if (error) {
        console.log(error)
        return null
    }

    function handleEventClick(e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, index:number) {
        e.stopPropagation()
        const target = e.target as HTMLElement
        if (target.closest('a')) {
            return
        }
        triggerRef.current = e.currentTarget as HTMLDivElement
        if (openPopover) {
            setOpenPopover(null)
            return
        }
        setOpenPopover(currentEvents[index])
    }

    function handleEventKeyDown(e: React.KeyboardEvent<HTMLDivElement>, index:number) {
        if (isNarrow) {
            return
        }
        if (e.currentTarget !== e.target) {
            return
        }
        if (e.key === "Enter" || e.key === ' ') {
            e.preventDefault();
            handleEventClick(e, index)
        }
    }

    function handlePopoverKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        if (e.key === 'Tab') {
            const container = popoverRef.current
            if (!container) {
                return
            }
            const focusables = container.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
            if (focusables.length === 0) {
                e.preventDefault()
                container.focus()
                return
            }
            const first = focusables[0]
            const last = focusables[focusables.length - 1]
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault()
                last.focus()
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault()
                first.focus()
            }
            return
        }
        if (e.key === 'Escape') {
            e.stopPropagation()
            setOpenPopover(null)
        }
    }
    
    return (
        <>
        {isLoaderVisible ? (
            <section
                className={`upcoming-loader ${isLoaderFading ? 'is-fading' : ''}`}
                aria-live="polite"
                aria-busy="true"
            >
                <div className="upcoming-loader-content">
                    <img
                        className="upcoming-loader-logo"
                        src="/assets/logo/artsideas-ampersand-black.svg"
                        alt=""
                        aria-hidden="true"
                    />
                    <p className="label">Loading Arts & Ideas Events</p>
                </div>
            </section>
        ) : null}
        <article id='upcoming-events' className={`upcoming-content ${isLoaderVisible ? 'is-pending' : 'is-ready'}`}>
            <h2 className="article-title">Upcoming<br/>Events</h2>
            <section className='upcoming-events'>
                <div className={isNarrow ? 'following-event' : 'next-event'}>
                    <div className='event-image-container'>
                        <AdvancedImage cldImg={firstEventImage} alt=""/>
                    </div>
                    <div className='event-details-container'>
                        <span className={isNarrow ? 'tag tag-shape absolute' : 'tag tag-shape'}>{currentEvents[0]?.category}</span>
                        <div className='event-description'>
                            <h3 className="secondary-title">{currentEvents[0]?.title}</h3>
                            <hr />
                            <EventDate event={currentEvents[0]} dates={currentEvents[0]?.dates}/>
                            <Location location={currentEvents[0]?.location}/>
                            <p>{currentEvents[0]?.description}</p>
                        </div>
                        <div></div>
                    {/* <EventCard event={currentEvents[0]} /> */}
                        
                    </div>
                </div>

                <div 
                    className='following-event'
                    role={!isNarrow ? 'button' : undefined}
                    tabIndex={!isNarrow ? 0 : undefined}
                    aria-expanded={!isNarrow ? openPopover?.id === currentEvents[1]?.id : undefined}
                    onClick={ 
                        !isNarrow ? 
                            (e) => handleEventClick(e, 1)
                            :
                            undefined
                        }
                    onKeyDown={
                        !isNarrow ? 
                        (e) => handleEventKeyDown(e, 1)
                        :
                        undefined
                    }
                    >
                        <div className='event-image-container'>
                            <AdvancedImage cldImg={secondEventImage} alt=""/>
                        </div>

                        <div className='event-details-container'>
                                <span className='tag tag-shape absolute'>{currentEvents[1]?.category}</span>
                                <div className='event-description'>
                                    <h3 className="secondary-title">{currentEvents[1]?.title}</h3>
                                    <hr />
                                    <EventDate event={currentEvents[1]} dates={currentEvents[1]?.dates}/>
                                    <Location location={currentEvents[1]?.location}/>
                                    {isNarrow ? <p>{currentEvents[1]?.description}</p> : null}
                                </div>
                                
                                
                        </div>
                </div>

                <div 
                    className='following-event'
                    role={!isNarrow ? 'button' : undefined}
                    tabIndex={!isNarrow ? 0 : undefined}
                    aria-expanded={!isNarrow ? openPopover?.id === currentEvents[2]?.id : undefined}
                    onClick={ 
                        !isNarrow ? 
                            (e) => handleEventClick(e, 2)
                            :
                            undefined
                        }
                    onKeyDown={
                        !isNarrow ? 
                        (e) => handleEventKeyDown(e, 2)
                        :
                        undefined
                    }
                    >
                        <div className='event-image-container'>
                            <AdvancedImage cldImg={thirdEventImage} alt=""/>
                        </div>

                        <div className='event-details-container'>
                                <span className='tag tag-shape absolute'>{currentEvents[2]?.category}</span>
                                <div className='event-description'>
                                    <h3 className="secondary-title">{currentEvents[2]?.title}</h3>
                                    <hr />
                                    <EventDate event={currentEvents[2]} dates={currentEvents[2]?.dates}/>
                                    <Location location={currentEvents[2]?.location}/>
                                    {isNarrow ? <p>{currentEvents[2]?.description}</p> : null} 
                                </div>
                                
                                
                        </div>
                </div>
            </section>
            <section className='popover-wrapper'>
                { openPopover && !isNarrow ? (
                <>
                    <div className='backdrop-popover' onClick={() => setOpenPopover(null)}/>
                    <div
                        className='calendar-day-popover'
                        role="dialog"
                        aria-label="Event details"
                        tabIndex={-1}
                        ref={popoverRef}
                        onKeyDown={handlePopoverKeyDown}
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
        </>
    )
}
