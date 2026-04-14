import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import './EditEventModal.css';
import './PendingEventModal.css';

const CATEGORY_OPTIONS = [
    'Music Performance', 'Theatre / Drama', 'Dance', 'Visual Arts',
    'Film / Screening', 'Lecture / Talk', 'Workshop / Master Class',
    'Gallery Exhibition', 'Literary Arts / Reading', 'Interdisciplinary', 'Other',
];

const API_BASE = import.meta.env.DEV ? 'http://localhost:3000' : '';

type Location = { key: string; venue: string; building: string | null; address: string };

type DateEntry = { id: string; start_date: string; has_end_date: boolean; end_date: string };

export type PendingEvent = {
    id: number;
    title: string;
    description: string;
    location_key: string;
    location?: {
        venue: string,
        building: string,
        map_url: string,
        location_key: string,
        address: string
    }
    category: string;
    custom_category: string | null;
    tags: string[] | null;
    contact_email: string | null;
    contact_phone: string | null;
    contact_name: string | null;
    status: string;
    img_id: string | null;
    created_at: string;
    updated_at: string;
    submitter_name: string;
    submitter_email: string;
    dates: { start_date: string; end_date: string | null }[];
    venue: string;
    building: string | null;
};

type EditForm = {
    title: string;
    dates: DateEntry[];
    location_key: string;
    description: string;
    category: string;
    custom_category: string;
    tags: string[];
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    status: string;
};

type FormErrors = {
    title?: string;
    dates?: string;
    date_start?: Record<string, string | undefined>;
    date_end?: Record<string, string | undefined>;
    location_key?: string;
    description?: string;
    category?: string;
    custom_category?: string;
};

function toDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function newDateEntry(): DateEntry {
    return { id: crypto.randomUUID(), start_date: '', has_end_date: false, end_date: '' };
}

function initForm(event: PendingEvent): EditForm {
    const isCustomCategory = event.category && !CATEGORY_OPTIONS.slice(0, -1).includes(event.category);
    return {
        title: event.title,
        dates: event.dates.map((d) => ({
            id: crypto.randomUUID(),
            start_date: d.start_date ? toDatetimeLocal(d.start_date) : '',
            has_end_date: !!d.end_date,
            end_date: d.end_date ? toDatetimeLocal(d.end_date) : '',
        })),
        location_key: event.location_key ?? '',
        description: event.description,
        category: isCustomCategory ? 'Other' : event.category,
        custom_category: isCustomCategory ? event.category : (event.custom_category ?? ''),
        tags: event.tags ?? [],
        contact_name: event.contact_name ?? '',
        contact_email: event.contact_email ?? '',
        contact_phone: event.contact_phone ?? '',
        status: event.status ?? 'pending',
    };
}

type Props = {
    event: PendingEvent;
    onClose: () => void;
    onSaved: (updated: PendingEvent) => void;
    onDeleted: (id: number) => void;
    onPublished: (id: number) => void;
};

export default function PendingEventModal({ event, onClose, onSaved, onDeleted, onPublished }: Props) {
    const [form, setForm] = useState<EditForm>(() => initForm(event));
    const [locations, setLocations] = useState<Location[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});
    const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'error'>('idle');
    const [confirmState, setConfirmState] = useState<'delete' | 'publish' | null>(null);
    const [actionStatus, setActionStatus] = useState<'idle' | 'loading' | 'error'>('idle');
    const backdropRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch(`${API_BASE}/api/locations`, { credentials: 'include' })
            .then((r) => r.json()).then(setLocations).catch(() => {});
    }, []);

    useEffect(() => {
        function onKey(e: globalThis.KeyboardEvent) {
            if (e.key === 'Escape') { if (confirmState) setConfirmState(null); else onClose(); }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose, confirmState]);

    function updateField<K extends keyof EditForm>(field: K, value: EditForm[K]) {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    function updateDate(id: string, changes: Partial<DateEntry>) {
        setForm((prev) => ({ ...prev, dates: prev.dates.map((d) => d.id === id ? { ...d, ...changes } : d) }));
        setErrors((prev) => ({
            ...prev,
            date_start: { ...prev.date_start, [id]: undefined },
            date_end: { ...prev.date_end, [id]: undefined },
            dates: undefined,
        }));
    }

    function addDate() { setForm((prev) => ({ ...prev, dates: [...prev.dates, newDateEntry()] })); }
    function removeDate(id: string) { setForm((prev) => ({ ...prev, dates: prev.dates.filter((d) => d.id !== id) })); }

    function commitTagInput() {
        const value = tagInput.trim().replace(/,$/, '').trim();
        if (value && !form.tags.includes(value)) updateField('tags', [...form.tags, value]);
        setTagInput('');
    }

    function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commitTagInput(); }
        else if (e.key === 'Backspace' && tagInput === '' && form.tags.length > 0) {
            updateField('tags', form.tags.slice(0, -1));
        }
    }

    function removeTag(tag: string) { updateField('tags', form.tags.filter((t) => t !== tag)); }

    function validate(): boolean {
        const errs: FormErrors = {};
        let valid = true;
        if (!form.title.trim()) { errs.title = 'Title is required'; valid = false; }
        if (form.dates.length === 0) { errs.dates = 'At least one date is required'; valid = false; }
        else {
            const startErrors: Record<string, string> = {};
            const endErrors: Record<string, string> = {};
            form.dates.forEach((d) => {
                if (!d.start_date) { startErrors[d.id] = 'Start date is required'; valid = false; }
                if (d.has_end_date) {
                    if (!d.end_date) { endErrors[d.id] = 'End date is required'; valid = false; }
                    else if (d.end_date <= d.start_date) { endErrors[d.id] = 'End date must be after start date'; valid = false; }
                }
            });
            if (Object.keys(startErrors).length) errs.date_start = startErrors;
            if (Object.keys(endErrors).length) errs.date_end = endErrors;
        }
        if (!form.location_key) { errs.location_key = 'Location is required'; valid = false; }
        if (!form.description.trim()) { errs.description = 'Description is required'; valid = false; }
        if (!form.category) { errs.category = 'Category is required'; valid = false; }
        if (form.category === 'Other' && !form.custom_category.trim()) {
            errs.custom_category = 'Please specify the category'; valid = false;
        }
        setErrors(errs);
        return valid;
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;
        setSaveStatus('loading');
        const payload = {
            title: form.title, location_key: form.location_key, description: form.description,
            category: form.category === 'Other' ? form.custom_category : form.category,
            tags: form.tags,
            contact_name: form.contact_name, contact_email: form.contact_email, contact_phone: form.contact_phone,
            status: form.status,
            dates: form.dates.map((d) => ({ start_date: d.start_date, end_date: d.has_end_date ? d.end_date : null })),
        };
        try {
            const res = await fetch(`${API_BASE}/api/events/pending/${event.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                credentials: 'include', body: JSON.stringify(payload),
            });
            if (res.ok) {
                const updatedEvent: PendingEvent = {
                    ...event, ...payload,
                    category: form.category === 'Other' ? form.custom_category : form.category,
                    tags: form.tags, updated_at: new Date().toISOString(),
                    dates: payload.dates,
                };
                onSaved(updatedEvent);
            } else { setSaveStatus('error'); }
        } catch { setSaveStatus('error'); }
        finally { if (saveStatus !== 'error') setSaveStatus('idle'); }
    }

    async function handleDelete() {
        setActionStatus('loading');
        try {
            const res = await fetch(`${API_BASE}/api/events/pending/${event.id}`, {
                method: 'DELETE', credentials: 'include',
            });
            if (res.ok) { onDeleted(event.id); }
            else { setActionStatus('error'); setConfirmState(null); }
        } catch { setActionStatus('error'); setConfirmState(null); }
    }

    async function handlePublish() {
        setActionStatus('loading');
        try {
            const res = await fetch(`${API_BASE}/api/events/pending/${event.id}/publish`, {
                method: 'POST', credentials: 'include',
            });
            if (res.ok) { onPublished(event.id); }
            else { setActionStatus('error'); setConfirmState(null); }
        } catch { setActionStatus('error'); setConfirmState(null); }
    }

    function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
        if (e.target === backdropRef.current) onClose();
    }

    const locationLabel = (loc: Location) => loc.building ? `${loc.venue} — ${loc.building}` : loc.venue;

    return (
        <div className="edit-modal-backdrop" ref={backdropRef} onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-label="Review Pending Event">
            <div className="edit-modal-panel">

                <header className="edit-modal-header">
                    <h2 className="edit-modal-title">Review Pending Event</h2>
                    <button className="edit-modal-close" onClick={onClose} aria-label="Close">&#x2715;</button>
                </header>

                {/* Submitter info */}
                <div className="pending-submitter-info">
                    <span className="pending-submitter-label">Submitted by</span>
                    <span className="pending-submitter-name">{event.submitter_name}</span>
                    <span className="pending-submitter-email">{event.submitter_email}</span>
                </div>

                <form className="edit-modal-form" onSubmit={handleSave} noValidate>

                    {/* Title */}
                    <div className="edit-form-field">
                        <label className="edit-label" htmlFor="pe-title">Title</label>
                        <input id="pe-title" type="text" value={form.title}
                            onChange={(e) => updateField('title', e.target.value)} aria-invalid={!!errors.title} />
                        {errors.title && <span className="edit-error" role="alert">{errors.title}</span>}
                    </div>

                    {/* Dates */}
                    <fieldset className="edit-form-field edit-dates-fieldset">
                        <legend className="edit-label">Date(s)</legend>
                        {errors.dates && <span className="edit-error" role="alert">{errors.dates}</span>}
                        <div className="edit-dates-list">
                            {form.dates.map((entry, idx) => (
                                <div key={entry.id} className="edit-date-entry">
                                    <div className="edit-date-row">
                                        <div className="edit-form-field">
                                            <label className="edit-label-muted" htmlFor={`pe-start-${entry.id}`}>
                                                {entry.has_end_date ? 'Start' : 'Date'}{form.dates.length > 1 ? ` ${idx + 1}` : ''}
                                            </label>
                                            <input id={`pe-start-${entry.id}`} type="datetime-local" value={entry.start_date}
                                                onChange={(e) => updateDate(entry.id, { start_date: e.target.value })}
                                                aria-invalid={!!errors.date_start?.[entry.id]} />
                                            {errors.date_start?.[entry.id] && <span className="edit-error" role="alert">{errors.date_start[entry.id]}</span>}
                                        </div>
                                        {entry.has_end_date && (
                                            <div className="edit-form-field">
                                                <label className="edit-label-muted" htmlFor={`pe-end-${entry.id}`}>End</label>
                                                <input id={`pe-end-${entry.id}`} type="datetime-local" min={entry.start_date} value={entry.end_date}
                                                    onChange={(e) => updateDate(entry.id, { end_date: e.target.value })}
                                                    aria-invalid={!!errors.date_end?.[entry.id]} />
                                                {errors.date_end?.[entry.id] && <span className="edit-error" role="alert">{errors.date_end[entry.id]}</span>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="edit-date-actions">
                                        <label className="edit-checkbox-label">
                                            <input type="checkbox" checked={entry.has_end_date}
                                                onChange={(e) => updateDate(entry.id, { has_end_date: e.target.checked, end_date: '' })} />
                                            Date range
                                        </label>
                                        {form.dates.length > 1 && (
                                            <button type="button" className="edit-btn-remove-date" onClick={() => removeDate(entry.id)}>Remove</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type="button" className="edit-btn-add-date" onClick={addDate}>+ Add another date</button>
                    </fieldset>

                    {/* Location */}
                    <div className="edit-form-field">
                        <label className="edit-label" htmlFor="pe-location">Location</label>
                        <select id="pe-location" value={form.location_key}
                            onChange={(e) => updateField('location_key', e.target.value)} aria-invalid={!!errors.location_key}>
                            <option value="" disabled>Select a location</option>
                            {locations.map((loc) => <option key={loc.key} value={loc.key}>{locationLabel(loc)}</option>)}
                        </select>
                        {errors.location_key && <span className="edit-error" role="alert">{errors.location_key}</span>}
                    </div>

                    {/* Description */}
                    <div className="edit-form-field">
                        <label className="edit-label" htmlFor="pe-description">Description</label>
                        <textarea id="pe-description" rows={5} value={form.description}
                            onChange={(e) => updateField('description', e.target.value)} aria-invalid={!!errors.description} />
                        {errors.description && <span className="edit-error" role="alert">{errors.description}</span>}
                    </div>

                    {/* Category */}
                    <div className="edit-form-field">
                        <label className="edit-label" htmlFor="pe-category">Category</label>
                        <select id="pe-category" value={form.category}
                            onChange={(e) => updateField('category', e.target.value)} aria-invalid={!!errors.category}>
                            <option value="" disabled>Select a category</option>
                            {CATEGORY_OPTIONS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        {errors.category && <span className="edit-error" role="alert">{errors.category}</span>}
                    </div>
                    {form.category === 'Other' && (
                        <div className="edit-form-field">
                            <label className="edit-label" htmlFor="pe-custom-category">Specify Category</label>
                            <input id="pe-custom-category" type="text" value={form.custom_category}
                                onChange={(e) => updateField('custom_category', e.target.value)} aria-invalid={!!errors.custom_category} />
                            {errors.custom_category && <span className="edit-error" role="alert">{errors.custom_category}</span>}
                        </div>
                    )}

                    {/* Tags */}
                    <div className="edit-form-field">
                        <label className="edit-label">Tags</label>
                        <div className="edit-tags-container">
                            {form.tags.map((tag) => (
                                <span key={tag} className="edit-tag-chip">
                                    {tag}
                                    <button type="button" className="edit-tag-remove" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>×</button>
                                </span>
                            ))}
                            <input type="text" className="edit-tag-input"
                                placeholder={form.tags.length === 0 ? 'Add tags…' : ''}
                                value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown} onBlur={commitTagInput} />
                        </div>
                        <span className="edit-hint">Press Enter or comma to add a tag</span>
                    </div>

                    {/* Contact */}
                    <div className="edit-form-field">
                        <label className="edit-label" htmlFor="pe-contact-name">Contact Name</label>
                        <input id="pe-contact-name" type="text" value={form.contact_name}
                            onChange={(e) => updateField('contact_name', e.target.value)} />
                    </div>
                    <div className="edit-form-field">
                        <label className="edit-label" htmlFor="pe-contact-email">Contact Email</label>
                        <input id="pe-contact-email" type="email" value={form.contact_email}
                            onChange={(e) => updateField('contact_email', e.target.value)} />
                    </div>
                    <div className="edit-form-field">
                        <label className="edit-label" htmlFor="pe-contact-phone">Contact Phone</label>
                        <input id="pe-contact-phone" type="tel" value={form.contact_phone}
                            onChange={(e) => updateField('contact_phone', e.target.value)} />
                    </div>

                    {/* Status */}
                    <div className="edit-form-field">
                        <label className="edit-label" htmlFor="pe-status">Status</label>
                        <select id="pe-status" value={form.status} onChange={(e) => updateField('status', e.target.value)}>
                            <option value="pending">Pending</option>
                            <option value="published">Published</option>
                        </select>
                    </div>

                    {/* Action row */}
                    <div className="pending-form-actions">
                        {/* Delete section */}
                        <div className="pending-action-group">
                            {confirmState === 'delete' ? (
                                <>
                                    <span className="pending-confirm-label">Delete this event?</span>
                                    <button type="button" className="pending-btn-confirm-delete"
                                        onClick={handleDelete} disabled={actionStatus === 'loading'}>
                                        {actionStatus === 'loading' ? 'Deleting…' : 'Confirm Delete'}
                                    </button>
                                    <button type="button" className="pending-btn-cancel-action"
                                        onClick={() => setConfirmState(null)}>Cancel</button>
                                </>
                            ) : (
                                <button type="button" className="pending-btn-delete"
                                    onClick={() => setConfirmState('delete')}>Delete</button>
                            )}
                        </div>

                        {/* Save / Publish section */}
                        <div className="pending-action-group pending-action-group--right">
                            {actionStatus === 'error' && <span className="edit-error">Something went wrong.</span>}
                            {saveStatus === 'error' && <span className="edit-error">Save failed.</span>}

                            {confirmState === 'publish' ? (
                                <>
                                    <span className="pending-confirm-label">Publish this event?</span>
                                    <button type="button" className="pending-btn-confirm-publish"
                                        onClick={handlePublish} disabled={actionStatus === 'loading'}>
                                        {actionStatus === 'loading' ? 'Publishing…' : 'Confirm Publish'}
                                    </button>
                                    <button type="button" className="pending-btn-cancel-action"
                                        onClick={() => setConfirmState(null)}>Cancel</button>
                                </>
                            ) : (
                                <>
                                    <button type="button" className="edit-btn-cancel" onClick={onClose}>Cancel</button>
                                    <button type="submit" className="edit-btn-save" disabled={saveStatus === 'loading'}>
                                        {saveStatus === 'loading' ? 'Saving…' : 'Save Changes'}
                                    </button>
                                    <button type="button" className="pending-btn-publish"
                                        onClick={() => setConfirmState('publish')}>Publish</button>
                                </>
                            )}
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
}
