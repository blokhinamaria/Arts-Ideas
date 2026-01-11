export type DateFormat = 'full' | 'weekday' | 'day' | 'time'

export function formatEventDate(dateString:string, format:DateFormat='full'):string {

    if (!dateString) return "";

    const date:Date = new Date(dateString);

    if (!date) return "";

    //for calendar view time display
    if (format === "time") {
        return new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        })
        .format(date)
        .replace("PM", "p.m.")
        .replace("AM", "a.m.");
    }

    //for calendar view
    if (format === "day") {
        return new Intl.DateTimeFormat("en-US", {
            month: "long",
            day: "numeric",
        })
        .format(date)
        .replace("PM", "p.m.")
        .replace("AM", "a.m.");
    }

    if (format === "weekday") {
        return new Intl.DateTimeFormat("en-US", {
            weekday: "short",
        })
        .format(date)
    }

    //for events details, format = full/default
    return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    })
    .format(date)
    .replace("PM", "p.m.")
    .replace("AM", "a.m.");
}