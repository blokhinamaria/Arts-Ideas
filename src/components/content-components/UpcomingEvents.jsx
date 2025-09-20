import './UpcomingEvents.css'


export default function UpcomingEvents() {
    const imgSrc = 'public/assets/img/hero-image-1.png';

    return (
        <article id='upcoming-events'>
            <h1>Upcoming<br/>Events</h1>
            <section className='upcoming-events'>

                <div className='next-event'>

                    <div className='next-event-image-container'>
                        <img src={imgSrc}></img>
                    </div>

                    <div className='next-event-details-container'>
                            <span className='tag tag-shape'>Concert</span>
                            <div className='next-event-description'>
                                <h5>St. Pete Baroque Ensemble Concert with Soprano Hein Jung</h5>
                                <hr />
                                <div className='next-event-data-location-group'>
                                <p className='body-large'>Friday, Sept. 6, 7:30 p.m.</p>
                                <p className='body-large'>Sykes Chapel and Center for Faith and Values</p>
                                </div>
                                <p>Join Tampa Bay’s only period instrument ensemble, St. Pete Baroque, and special guest artist Hein Jung for the opening concert of their 4th season.</p>
                            </div>
                            <button>Add to calendar</button>
                    </div>

                </div>

                <div className='following-events'>
                    <div className='following-event'>
                            <div className='following-event-image-container'>
                                <img src={imgSrc}></img>
                            </div>

                            <div className='following-event-details-container'>
                                    <span className='tag tag-shape absolute'>Concert</span>
                                    <div className='following-event-description'>
                                        <h5>St. Pete Baroque Ensemble Concert with Soprano Hein Jung</h5>
                                        <hr />
                                        <p className='body-large'>Friday, Sept. 6, 7:30 p.m.</p>
                                        <p className='body-large'>Sykes Chapel and Center for Faith and Values</p>
                                    </div>
                                    <button className='add-to-calendar-icon'><span className="material-symbols-outlined">
                                        calendar_add_on
                                    </span></button>
                            </div>
                    </div>

                    <div className='following-event'>
                            <div className='following-event-image-container'>
                                <img src={imgSrc}></img>
                            </div>
                            
                            <div className='following-event-details-container'>
                                    <span className='tag tag-shape absolute'>Concert</span>
                                    <div className='following-event-description'>
                                        <h5>St. Pete Baroque Ensemble Concert with Soprano Hein Jung</h5>
                                        <hr />
                                        
                                        <p className='body-large'>Friday, Sept. 6, 7:30 p.m.</p>
                                        <p className='body-large'>Sykes Chapel and Center for Faith and Values</p>
                                    </div>
                                    <button className='add-to-calendar-icon'><span className="material-symbols-outlined">
                                        calendar_add_on
                                    </span></button>
                            </div>
                    </div>
                </div>

            </section>
        </article>
    )
}