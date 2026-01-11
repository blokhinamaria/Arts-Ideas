import type { EventDateType}  from "./EventCard"
import { formatEventDate, type DateFormat} from "../utilities/FormatEventDate"

type EventDateProps = {
    date:EventDateType,
    format?:DateFormat
}

export default function EventDate({date , format='full'}:EventDateProps) {
    return (
        <p className='body-large'>
            {formatEventDate(date.start_date, format)}
        </p>
    )
}