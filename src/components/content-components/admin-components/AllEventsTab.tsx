import { useState, useEffect, useCallback } from 'react';
import AdminEventsTable, { isEventEditable } from './AdminEventsTable';
import EditEventModal, { type AdminEvent } from './EditEventModal';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3000' : '';

function getCurrentAcademicYearStart(d: Date): number {
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return month > 8 || (month === 8 && day >= 15) ? d.getFullYear() : d.getFullYear() - 1;
}

function formatYearLabel(yearStart: number): string {
    return `${yearStart}–${yearStart + 1}`;
}

type AdminEventsResponse = {
    events: AdminEvent[];
    total: number;
    page: number;
    totalPages: number;
};

export default function AllEventsTab() {
    const [years, setYears] = useState<number[]>([]);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [events, setEvents] = useState<AdminEvent[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [yearsLoading, setYearsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);

    // Fetch academic years on mount
    useEffect(() => {
        async function fetchYears() {
            try {
                setYearsLoading(true);
                const res = await fetch(`${API_BASE}/api/events/admin/academic-years`, {
                    credentials: 'include',
                });
                if (!res.ok) { setError('Failed to load academic years.'); return; }
                const data: { years: number[] } = await res.json();
                setYears(data.years);

                const currentYear = getCurrentAcademicYearStart(new Date());
                const defaultYear = data.years.includes(currentYear)
                    ? currentYear
                    : data.years[data.years.length - 1] ?? currentYear;
                setSelectedYear(defaultYear);
            } catch {
                setError('Failed to load academic years.');
            } finally {
                setYearsLoading(false);
            }
        }
        fetchYears();
    }, []);

    // Fetch events when year or page changes
    const fetchEvents = useCallback(async () => {
        if (selectedYear === null) return;
        try {
            setLoading(true);
            setError('');
            const res = await fetch(
                `${API_BASE}/api/events/admin/all?year=${selectedYear}&page=${page}`,
                { credentials: 'include' }
            );
            if (res.status === 401) { setError('Session expired. Please log in again.'); return; }
            if (!res.ok) { setError('Failed to load events.'); return; }
            const data: AdminEventsResponse = await res.json();
            setEvents(data.events);
            setTotalPages(data.totalPages);
            setTotal(data.total);
        } catch {
            setError('Failed to load events.');
        } finally {
            setLoading(false);
        }
    }, [selectedYear, page]);

    useEffect(() => {
        if (selectedYear !== null) fetchEvents();
    }, [fetchEvents, selectedYear]);

    function handleYearChange(year: number) {
        setSelectedYear(year);
        setPage(1);
    }

    if (yearsLoading) return <p className="admin-status">Loading academic years…</p>;

    return (
        <div className="all-events-tab">
            {/* Academic year sub-tabs */}
            {years.length > 0 && (
                <nav className="admin-year-tabs" aria-label="Academic year">
                    {years.map((year) => (
                        <button
                            key={year}
                            className={`admin-year-tab-btn${selectedYear === year ? ' is-active' : ''}`}
                            onClick={() => handleYearChange(year)}
                            aria-current={selectedYear === year ? 'true' : undefined}
                        >
                            {formatYearLabel(year)}
                        </button>
                    ))}
                </nav>
            )}

            <div className="admin-events-meta">
                {!loading && !error && selectedYear !== null && (
                    <span className="admin-total">
                        {total} event{total !== 1 ? 's' : ''} in {formatYearLabel(selectedYear)}
                    </span>
                )}
            </div>

            {error && <p className="admin-status admin-error">{error}</p>}
            {loading && <p className="admin-status">Loading events…</p>}

            {!loading && !error && events.length === 0 && (
                <p className="admin-status">No events found for this academic year.</p>
            )}

            {!loading && !error && events.length > 0 && (
                <>
                    <AdminEventsTable
                        events={events}
                        isEditable={isEventEditable}
                        onRowClick={setSelectedEvent}
                    />

                    {totalPages > 1 && (
                        <div className="admin-pagination">
                            <button
                                className="admin-page-btn"
                                onClick={() => setPage((p) => p - 1)}
                                disabled={page <= 1}
                            >
                                Previous
                            </button>
                            <span className="admin-page-info">Page {page} of {totalPages}</span>
                            <button
                                className="admin-page-btn"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}

            {selectedEvent && (
                <EditEventModal
                    event={selectedEvent}
                    locationKey={selectedEvent.location_key ?? ''}
                    onClose={() => setSelectedEvent(null)}
                    onSaved={() => {
                        setSelectedEvent(null);
                        fetchEvents();
                    }}
                />
            )}
        </div>
    );
}
