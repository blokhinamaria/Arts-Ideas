import type { EventDateType } from "../event-components/EventCard";

const today = new Date()
export const cutOffTime:Date = new Date(today.setMinutes(today.getMinutes() - 45));    

export function hasEventPassed(dates:EventDateType[]):boolean {
    return dates.every((date:EventDateType):boolean => 
            new Date(date.start_date) < cutOffTime
        )
}