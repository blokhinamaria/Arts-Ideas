import './MonthCalendarView.css'

export default function MonthCalendarView() {
    const daysInMonth = 30;
    const firstDayOffsset = 1;

    const calendarDays = [];

    //empty lots before the first day
    for (let i = 0; i < firstDayOffsset; i++) {
        calendarDays.push(
            <div key={`previous-${i}`} className="calendar-day empty" />
        );
    }
    
    //events array of objects
    const events = [
  {
    title: "Guest Artist Recital: Kevin Ayesh, Piano",
    date: "2025-09-06",
    time: "7:30 p.m.",
    location: "Charlene A. Gordon Theater, Ferman Center for the Arts",
    description: "Pianist Kevin Ayesh performs works by Bach, Beethoven, Brahms, and Chopin."
  },
  {
    title: "Faculty Recital: Duncan MacMillan, Harpsichord",
    date: "2025-09-14",
    time: "3 p.m.",
    location: "Charlene A. Gordon Theater, Ferman Center for the Arts",
    description: "Faculty Harpsichord recital featuring early Baroque masterworks by J.S. Bach and Francois Couperin."
  },
  {
    title: "Empathy Farming: The Evolution of Unhinged Mobile Game Ads",
    date: "2025-09-17",
    time: "1 p.m.",
    location: "Charlene A. Gordon Theater, Ferman Center for the Arts",
    description: "Talk on bizarre mobile game ad cutscenes and why they work, analyzing the puzzle game landscape."
  },
  {
    title: 'Scholars Symposium with Nathan Hensley: "Thought and Art in a Burning World: So What?"',
    date: "2025-09-19",
    time: "4–5 p.m.",
    location: "Trustees Boardroom, Vaughn Center",
    description: "Nathan Hensley (Georgetown University) discusses his book 'Action Without Hope: Victorian Literature After Climate Collapse'."
  },
  {
    title: "Sunscreen x FMX Presents: Creating a Sustainable Career in Film",
    date: "2025-09-23",
    time: "6:30 p.m.",
    location: "Charlene A. Gordon Theater, Ferman Center for the Arts",
    description: "What no one tells you about longevity, burnout, and reinvention. Featuring Christian Blauvelt from IndieWire."
  },
  {
    title: "Ars Sonora: The Music of Video Games",
    date: "2025-09-23",
    time: "8 p.m.",
    location: "Sykes Plaza",
    description: "Live performances of video game music, from 'Animal Crossing' to 'Baldur's Gate 3'."
  },
  {
    title: "Writers at the University featuring Carmen Maria Machado",
    date: "2025-09-25",
    time: "7 p.m.",
    location: "Charlene A. Gordon Theater, Ferman Center for the Arts",
    description: "Literary reading series featuring Carmen Maria Machado, blending memoir, horror, and speculative fiction."
  },
  {
    title: "UTampa Alumni Painting Reception",
    date: "2025-09-26",
    time: "6–8 p.m.",
    location: "Charlene and Mardy Gordon Performance Gallery, Ferman Center for the Arts",
    description: ""
  }
    ];

    //actual days 
    for (let d = 1; d <= daysInMonth; d++) {
        const dayEvents = [];
        for (let i = 0; i < events.length; i++) {
            if (events[i].date.endsWith(d)) {
                dayEvents.push(events[i]);
            } 
        }

        if (dayEvents.length > 1) {
                calendarDays.push(
                <div key={d} className="calendar-day">
                    <h4>{d}</h4>                
                    <div className="event">
                        <p className="body-large">{dayEvents[0].time}</p>
                        <h5>{dayEvents[0].title}</h5>
                    </div>
                    <span className='tag'>+ {dayEvents.length - 1} more</span>
                </div>
            )
        } else if (dayEvents.length === 1) {
                calendarDays.push(
                <div key={d} className="calendar-day">
                    <h4>{d}</h4>                
                    <div className="event">
                        <p className="body-large">{dayEvents[0].time}</p>
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