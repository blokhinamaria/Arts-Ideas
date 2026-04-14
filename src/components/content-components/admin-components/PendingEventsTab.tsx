import { useState, useEffect, useCallback } from 'react';
import { AdvancedImage } from '@cloudinary/react';
import { Cloudinary } from '@cloudinary/url-gen';
import { scale } from '@cloudinary/url-gen/actions/resize';
import { formatEventDate } from '../utilities/FormatEventDate';
import PendingEventModal, { type PendingEvent } from './PendingEventModal';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3000' : '';

const cloudinary = new Cloudinary({ cloud: { cloudName: 'ded4glttn' } });

function EventThumbnail({ imgId }: { imgId: string | null }) {
    const img = cloudinary
        .image(imgId || 'default_fzyquk')
        .format('auto')
        .quality('auto')
        .resize(scale().width(80));
    return <AdvancedImage cldImg={img} alt="" className="admin-thumbnail" />;
}

function formatTimestamp(ts: string): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
    }).format(new Date(ts));
}

type PendingEventsResponse = {
    events: PendingEvent[];
    total: number;
    page: number;
    totalPages: number;
};

type Props = {
    onCountChange?: (count: number) => void;
};

export default function PendingEventsTab({ onCountChange }: Props) {
    const [events, setEvents] = useState<PendingEvent[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedEvent, setSelectedEvent] = useState<PendingEvent | null>(null);

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const res = await fetch(`${API_BASE}/api/events/pending?page=${page}`, {
                credentials: 'include',
            });
            if (res.status === 401) { setError('Session expired. Please log in again.'); return; }
            if (!res.ok) { setError('Failed to load pending events.'); return; }
            const data: PendingEventsResponse = await res.json();
            setEvents(data.events);
            setTotalPages(data.totalPages);
            setTotal(data.total);
            onCountChange?.(data.total);
        } catch {
            setError('Failed to load pending events.');
        } finally {
            setLoading(false);
        }
    }, [page, onCountChange]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    function handleSaved(updatedEvent: PendingEvent) {
        setEvents((prev) => prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
        setSelectedEvent(null);
    }

    function handleDeleted(id: number) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        setTotal((t) => t - 1);
        onCountChange?.(total - 1);
        setSelectedEvent(null);
    }

    function handlePublished(id: number) {
        // Update status badge in-place; keep row visible until refresh
        setEvents((prev) =>
            prev.map((e) => (e.id === id ? { ...e, status: 'published' } : e))
        );
        setSelectedEvent(null);
    }

    return (
        <div className="pending-events-tab">
            <div className="admin-events-meta">
                {!loading && !error && (
                    <span className="admin-total">{total} pending event{total !== 1 ? 's' : ''}</span>
                )}
            </div>

            {error && <p className="admin-status admin-error">{error}</p>}
            {loading && <p className="admin-status">Loading pending events…</p>}

            {!loading && !error && events.length === 0 && (
                <p className="admin-status">No pending events.</p>
            )}

            {!loading && !error && events.length > 0 && (
                <>
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Cover Image</th>
                                    <th>Title</th>
                                    <th>Dates</th>
                                    <th>Location</th>
                                    <th>Description</th>
                                    <th>Category</th>
                                    <th>Tags</th>
                                    <th>Contact</th>
                                    <th>Status</th>
                                    <th>Submitter</th>
                                    <th>Submitted</th>
                                    <th>Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((event) => (
                                    <tr
                                        key={event.id}
                                        className="admin-table-row"
                                        onClick={() => setSelectedEvent(event)}
                                        role="button"
                                        tabIndex={0}
                                        title="Click to review"
                                        aria-label={`Review ${event.title}`}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                setSelectedEvent(event);
                                            }
                                        }}
                                    >
                                        <td className="admin-td-image">
                                            <EventThumbnail imgId={event.img_id} />
                                        </td>
                                        <td className="admin-td-title">{event.title}</td>
                                        <td className="admin-td-dates">
                                            {event.dates.map((d, i) => (
                                                <p key={i} className="admin-date-row">
                                                    {formatEventDate(d.start_date, 'full')}
                                                    {d.end_date ? <> &ndash; {formatEventDate(d.end_date, 'full')}</> : null}
                                                </p>
                                            ))}
                                        </td>
                                        <td className="admin-td-location">
                                            {event.location?.venue}
                                            {event.location?.building ? <><br />{event.location?.building}</> : null}
                                        </td>
                                        <td className="admin-td-description">{event.description}</td>
                                        <td>{event.category}</td>
                                        <td className="admin-td-tags">{event.tags?.join(', ') ?? '—'}</td>
                                        <td className="admin-td-contact">
                                            {event.contact_name && <>{event.contact_name}<br /></>}
                                            {event.contact_email ?? '—'}
                                        </td>
                                        <td>
                                            <span className={`admin-status-badge admin-status-${event.status?.toLowerCase()}`}>
                                                {event.status}
                                            </span>
                                        </td>
                                        <td className="admin-td-submitter">
                                            {event.submitter_name}
                                            <br />
                                            <span className="admin-td-contact">{event.submitter_email}</span>
                                        </td>
                                        <td className="admin-td-timestamp">{formatTimestamp(event.created_at)}</td>
                                        <td className="admin-td-timestamp">{formatTimestamp(event.updated_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="admin-pagination">
                            <button className="admin-page-btn" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
                                Previous
                            </button>
                            <span className="admin-page-info">Page {page} of {totalPages}</span>
                            <button className="admin-page-btn" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}

            {selectedEvent && (
                <PendingEventModal
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onSaved={handleSaved}
                    onDeleted={handleDeleted}
                    onPublished={handlePublished}
                />
            )}
        </div>
    );
}
