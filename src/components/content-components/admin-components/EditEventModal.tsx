import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import './EditEventModal.css';

const CATEGORY_OPTIONS = [
    'Music Performance',
    'Theatre / Drama',
    'Dance',
    'Visual Arts',
    'Film / Screening',
    'Lecture / Talk',
    'Workshop / Master Class',
    'Gallery Exhibition',
    'Literary Arts / Reading',
    'Interdisciplinary',
    'Other',
];

type Location = {
    key: string;
    venue: string;
    building: string | null;
    address: string;
};

type AdminEventDate = {
    start_date: string;
    end_date: string | null;
};

export type AdminEvent = {
    id: number;
    title: string;
    description: string;
    category: string;
    tags: string[] | null;
    contact: { contactName: string; contactEmail: string } | null;
    status: string;
    img_id: string | null;
    created_at: string;
    updated_at: string;
    dates: AdminEventDate[];
    venue: string;
    building: string | null;
    location_key?: string;
};

type DateEntry = {
    id: string;
    start_date: string;
    has_end_date: boolean;
    end_date: string;
};

type EditForm = {
    title: string;
    dates: DateEntry[];
    location_key: string;
    description: string;
    category: string;
    custom_category: string;
    tags: string[];
    contactName: string;
    contactEmail: string;
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

const API_BASE = import.meta.env.DEV ? 'http://localhost:3000' : '';

function toDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
}

function newDateEntry(): DateEntry {
    return { id: crypto.randomUUID(), start_date: '', has_end_date: false, end_date: '' };
}

function initForm(event: AdminEvent): EditForm {
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
        custom_category: isCustomCategory ? event.category : '',
        tags: event.tags ?? [],
        contactName: event.contact?.contactName ?? '',
        contactEmail: event.contact?.contactEmail ?? '',
        status: event.status ?? 'published',
    };
}

type Props = {
    event: AdminEvent;
    locationKey: string;
    onClose: () => void;
    onSaved: () => void;
};

export default function EditEventModal({ event, locationKey, onClose, onSaved }: Props) {
    const [form, setForm] = useState<EditForm>(() => initForm({ ...event, location_key: locationKey }));
    const [locations, setLocations] = useState<Location[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const backdropRef = useRef<HTMLDivElement>(null);

    // Fetch locations
    useEffect(() => {
        fetch(`${API_BASE}/api/locations`, { credentials: 'include' })
            .then((r) => r.json())
            .then(setLocations)
            .catch(() => {});
    }, []);

    // Close on Escape
    useEffect(() => {
        function onKey(e: globalThis.KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    function updateField<K extends keyof EditForm>(field: K, value: EditForm[K]) {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    function updateDate(id: string, changes: Partial<DateEntry>) {
        setForm((prev) => ({
            ...prev,
            dates: prev.dates.map((d) => (d.id === id ? { ...d, ...changes } : d)),
        }));
        setErrors((prev) => ({
            ...prev,
            date_start: { ...prev.date_start, [id]: undefined },
            date_end: { ...prev.date_end, [id]: undefined },
            dates: undefined,
        }));
    }

    function addDate() {
        setForm((prev) => ({ ...prev, dates: [...prev.dates, newDateEntry()] }));
    }

    function removeDate(id: string) {
        setForm((prev) => ({ ...prev, dates: prev.dates.filter((d) => d.id !== id) }));
    }

    // Tag chip helpers
    function commitTagInput() {
        const value = tagInput.trim().replace(/,$/, '').trim();
        if (value && !form.tags.includes(value)) {
            updateField('tags', [...form.tags, value]);
        }
        setTagInput('');
    }

    function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commitTagInput();
        } else if (e.key === 'Backspace' && tagInput === '' && form.tags.length > 0) {
            updateField('tags', form.tags.slice(0, -1));
        }
    }

    function removeTag(tag: string) {
        updateField('tags', form.tags.filter((t) => t !== tag));
    }

    function validate(): boolean {
        const errs: FormErrors = {};
        let valid = true;

        if (!form.title.trim()) { errs.title = 'Title is required'; valid = false; }

        if (form.dates.length === 0) {
            errs.dates = 'At least one date is required'; valid = false;
        } else {
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

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;

        setSubmitStatus('loading');

        const payload = {
            title: form.title,
            location_key: form.location_key,
            description: form.description,
            category: form.category === 'Other' ? form.custom_category : form.category,
            tags: form.tags,
            contact: { contactName: form.contactName, contactEmail: form.contactEmail },
            status: form.status,
            dates: form.dates.map((d) => ({
                start_date: d.start_date,
                end_date: d.has_end_date ? d.end_date : null,
            })),
        };

        try {
            const res = await fetch(`${API_BASE}/api/events/admin/${event.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setSubmitStatus('success');
                onSaved();
                onClose();
            } else {
                setSubmitStatus('error');
            }
        } catch {
            setSubmitStatus('error');
        }
    }

    function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
        if (e.target === backdropRef.current) onClose();
    }

    const locationLabel = (loc: Location) =>
        loc.building ? `${loc.venue} — ${loc.building}` : loc.venue;

    return (
        <div
            className="edit-modal-backdrop"
            ref={backdropRef}
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-label="Edit Event"
        >
            <div className="edit-modal-panel">
                <header className="edit-modal-header">
                    <h2 className="edit-modal-title">Edit Event</h2>
                    <button className="edit-modal-close" onClick={onClose} aria-label="Close">&#x2715;</button>
                </header>

                <form className="edit-modal-form" onSubmit={handleSubmit} noValidate>

                    {/* Title */}
                    <div className="edit-form-field">
                        <label className="edit-label" htmlFor="edit-title">Title</label>
                        <input
                            id="edit-title"
                            type="text"
                            value={form.title}
                            onChange={(e) => updateField('title', e.target.value)}
                            aria-invalid={!!errors.title}
                        />
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
                                            <label className="edit-label-muted" htmlFor={`edit-start-${entry.id}`}>
                                                {entry.has_end_date ? 'Start' : 'Date'}{form.dates.length > 1 ? ` ${idx + 1}` : ''}
                                            </label>
                                            <input
                                                id={`edit-start-${entry.id}`}
                                                type="datetime-local"
                                                value={entry.start_date}
                                                onChange={(e) => updateDate(entry.id, { start_date: e.target.value })}
                                                aria-invalid={!!errors.date_start?.[entry.id]}
                                            />
                                            {errors.date_start?.[entry.id] && (
                                                <span className="edit-error" role="alert">{errors.date_start[entry.id]}</span>
                                            )}
                                        </div>

                                        {entry.has_end_date && (
                                            <div className="edit-form-field">
                                                <label className="edit-label-muted" htmlFor={`edit-end-${entry.id}`}>End</label>
                                                <input
                                                    id={`edit-end-${entry.id}`}
                                                    type="datetime-local"
                                                    min={entry.start_date}
                                                    value={entry.end_date}
                                                    onChange={(e) => updateDate(entry.id, { end_date: e.target.value })}
                                                    aria-invalid={!!errors.date_end?.[entry.id]}
                                                />
                                                {errors.date_end?.[entry.id] && (
                                                    <span className="edit-error" role="alert">{errors.date_end[entry.id]}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="edit-date-actions">
                                        <label className="edit-checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={entry.has_end_date}
                                                onChange={(e) =>
                                                    updateDate(entry.id, { has_end_date: e.target.checked, end_date: '' })
                                                }
                                            />
                                            Date range
                                        </label>
                                        {form.dates.length > 1 && (
                                            <button
                                                type="button"
                                                className="edit-btn-remove-date"
                                                onClick={() => removeDate(entry.id)}
                                                aria-label={`Remove date ${idx + 1}`}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type="button" className="edit-btn-add-date" onClick={addDate}>
                            + Add another date
                        </button>
                    </fieldset>

                    {/* Location */}
                    <div className="edit-form-field">
                        <label className="edit-label" htmlFor="edit-location">Location</label>
                        <select
                            id="edit-location"
                            value={form.location_key}
                            onChange={(e) => updateField('location_key', e.target.value)}
                            aria-invalid={!!errors.location_key}
                        >
                            <option value="" disabled>Select a location</option>
                            {locations.map((loc) => (
                                <option key={loc.key} value={loc.key}>{locationLabel(loc)}</option>
                            ))}
                        </select>
                        {errors.location_key && <span className="edit-error" role="alert">{errors.location_key}</span>}
                    </div>

                    {/* Description */}
                    <div className="edit-form-field">
                        <label className="edit-label" htmlFor="edit-description">Description</label>
                        <textarea
                            id="edit-description"
                            rows={5}
                            value={form.description}
                            onChange={(e) => updateField('description', e.target.value)}
                            aria-invalid={!!errors.description}
                        />
                        {errors.description && <span className="edit-error" role="alert">{errors.description}</span>}
                    </div>

                    {/* Category */}
                    <div className="edit-form-field">
                        <label className="edit-label" htmlFor="edit-category">Category</label>
                        <select
                            id="edit-category"
                            value={form.category}
                            onChange={(e) => updateField('category', e.target.value)}
                            aria-invalid={!!errors.category}
                        >
                            <option value="" disabled>Select a category</option>
                            {CATEGORY_OPTIONS.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        {errors.category && <span className="edit-error" role="alert">{errors.category}</span>}
                    </div>

                    {form.category === 'Other' && (
                        <div className="edit-form-field">
                            <label className="edit-label" htmlFor="edit-custom-category">Specify Category</label>
                            <input
                                id="edit-custom-category"
                                type="text"
                                value={form.custom_category}
                                onChange={(e) => updateField('custom_category', e.target.value)}
                                aria-invalid={!!errors.custom_category}
                            />
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
                                    <button
                                        type="button"
                                        className="edit-tag-remove"
                                        onClick={() => removeTag(tag)}
                                        aria-label={`Remove tag ${tag}`}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                            <input
                                type="text"
                                className="edit-tag-input"
                                placeholder={form.tags.length === 0 ? 'Add tags…' : ''}
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                onBlur={commitTagInput}
                            />
                        </div>
                        <span className="edit-hint">Press Enter or comma to add a tag</span>
                    </div>

                    {/* Contact */}
                    <div className="edit-form-field">
                        <label className="edit-label" htmlFor="edit-contact-name">Contact Name</label>
                        <input
                            id="edit-contact-name"
                            type="text"
                            value={form.contactName}
                            onChange={(e) => updateField('contactName', e.target.value)}
                        />
                    </div>

                    <div className="edit-form-field">
                        <label className="edit-label" htmlFor="edit-contact-email">Contact Email</label>
                        <input
                            id="edit-contact-email"
                            type="email"
                            value={form.contactEmail}
                            onChange={(e) => updateField('contactEmail', e.target.value)}
                        />
                    </div>

                    {/* Status */}
                    <div className="edit-form-field">
                        <label className="edit-label" htmlFor="edit-status">Status</label>
                        <select
                            id="edit-status"
                            value={form.status}
                            onChange={(e) => updateField('status', e.target.value)}
                        >
                            <option value="published">Published</option>
                            <option value="unpublished">Unpublished</option>
                        </select>
                    </div>

                    {/* Submit */}
                    <div className="edit-form-actions">
                        {submitStatus === 'error' && (
                            <p className="edit-error" role="alert">Something went wrong. Please try again.</p>
                        )}
                        <button type="button" className="edit-btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="edit-btn-save" disabled={submitStatus === 'loading'}>
                            {submitStatus === 'loading' ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
