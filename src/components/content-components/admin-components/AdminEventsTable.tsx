import { AdvancedImage } from '@cloudinary/react';
import { Cloudinary } from '@cloudinary/url-gen';
import { scale } from '@cloudinary/url-gen/actions/resize';
import { formatEventDate } from '../utilities/FormatEventDate';
import type { AdminEvent } from './EditEventModal';

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
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).format(new Date(ts));
}

export function isEventEditable(event: AdminEvent): boolean {
    const now = new Date();
    return event.dates.some(
        (d) =>
            new Date(d.start_date) >= now ||
            (d.end_date != null && new Date(d.end_date) >= now)
    );
}

type Props = {
    events: AdminEvent[];
    onRowClick: (event: AdminEvent) => void;
    isEditable: (event: AdminEvent) => boolean;
};

export default function AdminEventsTable({ events, onRowClick, isEditable }: Props) {
    return (
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
                        <th>Created</th>
                        <th>Updated</th>
                    </tr>
                </thead>
                <tbody>
                    {events.map((event) => {
                        const editable = isEditable(event);
                        return (
                            <tr
                                key={event.id}
                                className={`admin-table-row${editable ? '' : ' admin-table-row--past'}`}
                                onClick={editable ? () => onRowClick(event) : undefined}
                                role={editable ? 'button' : undefined}
                                tabIndex={editable ? 0 : undefined}
                                title={editable ? 'Click to edit' : undefined}
                                aria-label={editable ? `Edit ${event.title}` : undefined}
                                onKeyDown={
                                    editable
                                        ? (e) => {
                                              if (e.key === 'Enter' || e.key === ' ') {
                                                  e.preventDefault();
                                                  onRowClick(event);
                                              }
                                          }
                                        : undefined
                                }
                            >
                                <td className="admin-td-image">
                                    <EventThumbnail imgId={event.img_id} />
                                </td>
                                <td className="admin-td-title">{event.title}</td>
                                <td className="admin-td-dates">
                                    {event.dates.map((d, i) => (
                                        <p key={i} className="admin-date-row">
                                            {formatEventDate(d.start_date, 'full')}
                                            {d.end_date ? (
                                                <> &ndash; {formatEventDate(d.end_date, 'full')}</>
                                            ) : null}
                                        </p>
                                    ))}
                                </td>
                                <td className="admin-td-location">
                                    {event.venue}
                                    {event.building ? <><br />{event.building}</> : null}
                                </td>
                                <td className="admin-td-description">{event.description}</td>
                                <td>{event.category}</td>
                                <td className="admin-td-tags">
                                    {event.tags?.join(', ') ?? '—'}
                                </td>
                                <td className="admin-td-contact">
                                    {event.contact ? (
                                        <>
                                            {event.contact.contactName}
                                            <br />
                                            {event.contact.contactEmail}
                                        </>
                                    ) : '—'}
                                </td>
                                <td>
                                    <span className={`admin-status-badge admin-status-${event.status?.toLowerCase()}`}>
                                        {event.status}
                                    </span>
                                </td>
                                <td className="admin-td-timestamp">{formatTimestamp(event.created_at)}</td>
                                <td className="admin-td-timestamp">{formatTimestamp(event.updated_at)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
