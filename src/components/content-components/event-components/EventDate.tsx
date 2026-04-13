import type { EventDateType, EventType}  from "./EventCard"
import { formatEventDate, type DateFormat} from "../utilities/FormatEventDate"
import AddToCalendar from "./AddToCalendar"

type EventDateProps = {
    dates:EventDateType[],
    format?:DateFormat,
    event?:EventType,
}

export default function EventDate({dates , format='full', event}:EventDateProps) {
    if (!dates) {
        return null
    }
    const today = new Date()
    const firstDate = dates[0]
    const otherDates:string | null = dates.length > 0 ? generateAdditionalDates() : null
    
    function generateAdditionalDates() {
        const additionalDates = dates.slice(1)
        let additionalDatesString:string = ''
        for (const date of additionalDates) {
            if (additionalDatesString.length !== 0) {
                additionalDatesString += ', '
            }
            if (date.end_date) {
                additionalDatesString += formatEventDate(date.start_date, 'full')
                additionalDatesString += ' – ' + formatEventDate(date.end_date, 'full')
            } else {
                additionalDatesString += formatEventDate(date.start_date, 'full')
            }
        }
        return additionalDatesString
    }

    const end_date_format:DateFormat = 
        format === 'full' ? format : (
            firstDate.end_date && new Date(firstDate.start_date).setHours(0) === new Date(firstDate.end_date).setHours(0) ? format : 'full'
        )

    return (
        <>
            <div className="date-group">
                <p className='body-large'>
                    {
                        firstDate.end_date ? (
                            <>
                                <span>
                                    {formatEventDate(firstDate.start_date, format)} –
                                </span>
                                <br></br>
                                <span className='body-large'>
                                    {formatEventDate(firstDate.end_date, end_date_format)}
                                </span>
                            </>
                        ) : (
                                formatEventDate(firstDate.start_date, format)

                        )
                    }
                    <br></br>
                    {otherDates && 
                        <span className="subtle">
                            Also on {otherDates}
                        </span>
                    }
                </p>
                
                {(new Date(firstDate.start_date) > today) && event &&
                    <AddToCalendar event={event} date={firstDate} />
                }
            </div>
            
        </>
        
    )
}