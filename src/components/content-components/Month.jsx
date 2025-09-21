import './Month.css'
import MonthListView from './month-view-components/MonthListView'
import MonthCalendarView from './month-view-components/MonthCalendarView'
import { useState } from 'react'

export default function Month() {
    //switch views
    const [isListView, setIsListView] = useState(true);

    function switchViews() {
        setIsListView(prev => !prev)
    }

    return (
        <article id='month'>
            <section className="month-title-banner">
                <button className='month-swipe disabled'><span className="material-symbols-outlined">keyboard_double_arrow_left</span></button>
                <div>
                    <h2>More in</h2>
                    <h1>September</h1>
                </div>
                <button className='month-swipe'><span className="material-symbols-outlined">keyboard_double_arrow_right</span></button> 
            </section>
            <div className='sticky-image'
                style={
                    {
                        backgroundImage: `url('/public/assets/img/hero-image-1.png')`
                    }
                }>
            </div>
            <section className='month-buttons'>
                <button onClick={switchViews}>Switch to {isListView ? "Calendar" : "List"} view</button>
                <button>Add to calendar</button>
            </section>
            {isListView ? <MonthListView /> : <MonthCalendarView />}
        </article>
        
    )
}