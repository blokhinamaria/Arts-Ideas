import { useRef, useState, useEffect } from 'react'
import type { EventType, EventDateType, EventLocationType } from './EventCard'

type AddToCalendarProps = {
    event: EventType
    date: EventDateType
}

function toUtcString(dateString: string): string {
    const d = new Date(dateString)
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function buildLocation(location: EventLocationType): string {
    const parts = [location.venue]
    if (location.building) parts.push(location.building)
    parts.push(location.address)
    return parts.join(', ')
}

function buildDescription(event: EventType): string {
    return `${event.description}\n\n${window.location.origin}`
}

function getEndDate(date: EventDateType): Date {
    if (date.end_date) return new Date(date.end_date)
    const start = new Date(date.start_date)
    start.setHours(start.getHours() + 1)
    return start
}

function openGoogleCalendar(event: EventType, date: EventDateType) {
    const start = toUtcString(date.start_date)
    const end = toUtcString(getEndDate(date).toISOString())
    const location = buildLocation(event.location)
    const description = buildDescription(event)

    const url = new URL('https://calendar.google.com/calendar/render')
    url.searchParams.set('action', 'TEMPLATE')
    url.searchParams.set('text', event.title)
    url.searchParams.set('dates', `${start}/${end}`)
    url.searchParams.set('details', description)
    url.searchParams.set('location', location)

    window.open(url.toString(), '_blank', 'noopener,noreferrer')
}

function openOutlookCalendar(event: EventType, date: EventDateType) {
    const startIso = new Date(date.start_date).toISOString()
    const endIso = getEndDate(date).toISOString()
    const location = buildLocation(event.location)
    const description = buildDescription(event)

    const url = new URL('https://outlook.live.com/calendar/0/deeplink/compose')
    url.searchParams.set('subject', event.title)
    url.searchParams.set('startdt', startIso)
    url.searchParams.set('enddt', endIso)
    url.searchParams.set('body', description)
    url.searchParams.set('location', location)
    url.searchParams.set('path', '/calendar/action/compose')

    window.open(url.toString(), '_blank', 'noopener,noreferrer')
}

function downloadIcs(event: EventType, date: EventDateType, filename: string) {
    const start = toUtcString(date.start_date)
    const end = toUtcString(getEndDate(date).toISOString())
    const location = buildLocation(event.location)
    const description = buildDescription(event).replace(/\n/g, '\\n')

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Arts Ideas//EN',
        'BEGIN:VEVENT',
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        'END:VEVENT',
        'END:VCALENDAR',
    ].join('\r\n')

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
}

const CALENDAR_OPTIONS = [
    { label: 'Google Calendar', id: 'google' },
    { label: 'Apple Calendar', id: 'apple' },
    { label: 'Outlook.com', id: 'outlook' },
    { label: 'Download .ics', id: 'ics' },
]

export default function AddToCalendar({ event, date }: AddToCalendarProps) {
    const [open, setOpen] = useState(false)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const popoverRef = useRef<HTMLDivElement>(null)
    const hasOpenedRef = useRef(false)

    useEffect(() => {
        if (open) {
            hasOpenedRef.current = true
            popoverRef.current?.focus()
        } else if (hasOpenedRef.current) {
            triggerRef.current?.focus()
        }
    }, [open])

    function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        if (e.key === 'Escape') {
            setOpen(false)
            return
        }
        if (e.key === 'Tab') {
            const focusable = popoverRef.current?.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
            if (!focusable || focusable.length === 0) return
            const first = focusable[0]
            const last = focusable[focusable.length - 1]
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault()
                    last.focus()
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault()
                    first.focus()
                }
            }
        }
    }

    function handleSelect(id: string) {
        switch (id) {
            case 'google':
                openGoogleCalendar(event, date)
                break
            case 'apple':
                downloadIcs(event, date, `${event.title.replace(/\s+/g, '-')}.ics`)
                break
            case 'outlook':
                openOutlookCalendar(event, date)
                break
            case 'ics':
                downloadIcs(event, date, `${event.title.replace(/\s+/g, '-')}.ics`)
                break
        }
        setOpen(false)
    }

    return (
        <div className="add-to-calendar-wrapper">
            <button
                ref={triggerRef}
                className="add-to-calendar-icon"
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-label="Add to calendar"
                onClick={(e) => (e.stopPropagation(), setOpen(true))}
            >
                <span className="material-symbols-outlined">calendar_add_on</span>
            </button>

            {open && (
                <>
                    <div
                        className="add-to-calendar-backdrop"
                        onClick={() => setOpen(false)}
                        aria-hidden="true"
                    />
                    <div
                        ref={popoverRef}
                        className="add-to-calendar-popover"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Add to calendar"
                        tabIndex={-1}
                        onKeyDown={handleKeyDown}
                    >
                        <h5>Add to calendar</h5>
                        {CALENDAR_OPTIONS.map((option) => (
                            <button
                                key={option.id}
                                className="calendar-option"
                                onClick={() => handleSelect(option.id)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
