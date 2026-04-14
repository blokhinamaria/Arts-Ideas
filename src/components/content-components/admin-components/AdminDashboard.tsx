import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import AdminEventsTable from './AdminEventsTable';
import AllEventsTab from './AllEventsTab';
import PendingEventsTab from './PendingEventsTab';
import ImagesTab from './ImagesTab';
import EditEventModal, { type AdminEvent } from './EditEventModal';
import './AdminDashboard.css';

type AdminEventsResponse = {
    events: AdminEvent[];
    total: number;
    page: number;
    totalPages: number;
};

const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3000' : '';

type Tab = 'upcoming' | 'all' | 'pending' | 'images';

export default function AdminDashboard() {
    const { user, loading, logout } = useAuth();

    const [activeTab, setActiveTab] = useState<Tab>('upcoming');
    const [pendingCount, setPendingCount] = useState<number | null>(null);

    // Upcoming tab state
    const [events, setEvents] = useState<AdminEvent[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);

    const fetchEvents = useCallback(async () => {
        try {
            setEventsLoading(true);
            setError('');
            const res = await fetch(`${API_BASE_URL}/api/events/admin?page=${page}`, {
                credentials: 'include',
            });
            if (res.status === 401) { setError('Session expired. Please log in again.'); return; }
            if (!res.ok) { setError('Failed to load events.'); return; }
            const data: AdminEventsResponse = await res.json();
            setEvents(data.events);
            setTotalPages(data.totalPages);
            setTotal(data.total);
        } catch {
            setError('Failed to load events.');
        } finally {
            setEventsLoading(false);
        }
    }, [page]);

    useEffect(() => {
        if (!user) return;
        fetchEvents();
    }, [user, fetchEvents]);

    if (loading) return <p className="admin-status">Loading...</p>;
    if (!user) return <Navigate to="/login" replace />;

    return (
        <article className="admin-dashboard">
            <header className="admin-header">
                <h1 className="admin-title">Admin Dashboard</h1>
                <button className="admin-logout" onClick={logout}>Logout</button>
            </header>

            {/* Top-level tab nav */}
            <nav className="admin-tabs" aria-label="Dashboard sections">
                <button
                    className={`admin-tab-btn${activeTab === 'upcoming' ? ' is-active' : ''}`}
                    onClick={() => setActiveTab('upcoming')}
                    aria-current={activeTab === 'upcoming' ? 'true' : undefined}
                >
                    Upcoming &amp; Ongoing
                </button>
                <button
                    className={`admin-tab-btn${activeTab === 'all' ? ' is-active' : ''}`}
                    onClick={() => setActiveTab('all')}
                    aria-current={activeTab === 'all' ? 'true' : undefined}
                >
                    All Events
                </button>
                <button
                    className={`admin-tab-btn${activeTab === 'pending' ? ' is-active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                    aria-current={activeTab === 'pending' ? 'true' : undefined}
                >
                    Pending Approval
                    {pendingCount !== null && pendingCount > 0 && (
                        <span className="admin-tab-badge">{pendingCount}</span>
                    )}
                </button>
                <button
                    className={`admin-tab-btn${activeTab === 'images' ? ' is-active' : ''}`}
                    onClick={() => setActiveTab('images')}
                    aria-current={activeTab === 'images' ? 'true' : undefined}
                >
                    Images
                </button>
            </nav>

            {/* ── Upcoming & Ongoing tab ── */}
            {activeTab === 'upcoming' && (
                <section className="admin-events-section">
                    <div className="admin-events-meta">
                        <h2 className="admin-section-title">Upcoming &amp; Ongoing Events</h2>
                        {!eventsLoading && !error && (
                            <span className="admin-total">{total} event{total !== 1 ? 's' : ''}</span>
                        )}
                    </div>

                    {error && <p className="admin-status admin-error">{error}</p>}
                    {eventsLoading && <p className="admin-status">Loading events...</p>}

                    {!eventsLoading && !error && events.length === 0 && (
                        <p className="admin-status">No upcoming or ongoing events found.</p>
                    )}

                    {!eventsLoading && !error && events.length > 0 && (
                        <>
                            <AdminEventsTable
                                events={events}
                                isEditable={() => true}
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
                </section>
            )}

            {/* ── All Events tab ── */}
            {activeTab === 'all' && (
                <section className="admin-events-section">
                    <div className="admin-events-meta">
                        <h2 className="admin-section-title">All Events</h2>
                    </div>
                    <AllEventsTab />
                </section>
            )}

            {/* ── Pending Approval tab ── */}
            {activeTab === 'pending' && (
                <section className="admin-events-section">
                    <div className="admin-events-meta">
                        <h2 className="admin-section-title">Pending Approval</h2>
                    </div>
                    <PendingEventsTab onCountChange={setPendingCount} />
                </section>
            )}

            {/* ── Images tab ── */}
            {activeTab === 'images' && (
                <section className="admin-events-section">
                    <div className="admin-events-meta">
                        <h2 className="admin-section-title">Image Library</h2>
                    </div>
                    <ImagesTab />
                </section>
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
        </article>
    );
}
