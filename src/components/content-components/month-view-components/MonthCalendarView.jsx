import './MonthCalendarView.css';

import { formatEventDate } from '../utilities/FormatEventDate';

export default function MonthCalendarView({events}) {

    const today = new Date();

    const daysInMonth = 30;
    const firstDayOffsset = 1;

    const calendarDays = [];

    //empty lots before the first day
    for (let i = 0; i < firstDayOffsset; i++) {
        calendarDays.push(
            <div key={`previous-${i}`} className="calendar-day empty" />
        );
    } 

    //actual days 
    for (let d = 1; d <= daysInMonth; d++) {
        const dayEvents = [];
        for (let i = 0; i < events.length; i++) {
            const eventDay = new Date(events[i].date).getDate();
            if (eventDay === d) {
                dayEvents.push(events[i]);
            } 
        }

        if (dayEvents.length > 1) {
                calendarDays.push(
                <div key={d} className="calendar-day">
                    <h4>{d}</h4>                
                    <div className="event">
                        <p className="body-large">{formatEventDate(dayEvents[0].date, 'time')}</p>
                        <h5>{dayEvents[0].title}</h5>
                    </div>
                    <span className='tag'> + {dayEvents.length - 1} more</span>
                </div>
            )
        } else if (dayEvents.length === 1) {
                calendarDays.push(
                <div key={d} className="calendar-day">
                    <h4>{d}</h4>                
                    <div className="event">
                        <p className="body-large">{formatEventDate(dayEvents[0].date, 'time')}</p>
                        <h5>{dayEvents[0].title}</h5>
                    </div>
                </div>
                )
        } else {
            calendarDays.push(
                <div key={d} className="calendar-day empty">
                    <h4>{d}</h4>
                </div>
            )
        }
        
    }

    return (
        <section className="calendar">
            {/* <div className='days-of-week'>
                <h4>Sun</h4>
                <h4>Mon</h4>
                <h4>Tue</h4>
                <h4>Wed</h4>
                <h4>Thu</h4>
                <h4>Fri</h4>
                <h4>Sat</h4>
            </div> */}
            
            {calendarDays}
        </section>
    )
}