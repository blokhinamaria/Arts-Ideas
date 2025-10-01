import './MonthCalendarView.css';

import { formatEventDate } from '../utilities/FormatEventDate';

export default function MonthCalendarView({events, selectedDate}) {

    const today = new Date();

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    const daysInMonth= getDaysInMonth();

    function getDaysInMonth() {
        return new Date(year, month + 1, 0).getDate();
    };


    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    const weekdayLabels = weekdays.map(day => (
        <div key={day} className="calendar-day day-of-week"><h5>{day}</h5></div>
    ))

    const calendarDays = [];

    //empty lots before the first day
    const firstDay = new Date(year, month, 1);
    const firstDayOffsset = firstDay.getDay();

    for (let i = 0; i < firstDayOffsset; i++) {
        calendarDays.push(
            <div key={`previous-${i}`} className="calendar-day empty offset-days" />
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
                <div key={d} className={new Date(dayEvents[dayEvents.length - 1].date) < today ? 'calendar-day completed' : 'calendar-day'}>
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
                <div key={d} className={new Date(dayEvents[0].date) < today ? 'calendar-day completed' : 'calendar-day'}>
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
            {weekdayLabels}
            {calendarDays}
        </section>
    )
}