import { useState } from 'react';
import './SubmitEvent.css';
import Form from '../elements/Form/Form';

// IMPORT FROM DB
const LOCATION_OPTIONS = [
    { value: 'gordon_theater',      label: 'Gordon Theater' },
    { value: 'performance_gallery', label: 'Performance Gallery' },
    { value: 'saunders_gallery',    label: 'Saunders Gallery' },
    { value: 'black_box_theater',   label: 'Black Box Theater' },
    { value: 'design_studios',      label: 'Design Studios' },
    { value: 'scarfone_gallery',    label: 'Scarfone Gallery' },
    { value: 'sykes_plaza',         label: 'Sykes Plaza' },
    { value: 'sykes_chapel',        label: 'Sykes Chapel' },
    { value: 'reeves_theater',      label: 'Reeves Theater' },
    { value: 'crescent_club',       label: 'Crescent Club' },
    { value: 'falk_theatre',        label: 'Falk Theatre' },
    { value: 'plant_hall',          label: 'Plant Hall' },
    { value: 'fletcher_lounge',     label: 'Fletcher Lounge' },
    { value: 'music_room',          label: 'Music Room' },
    { value: 'grand_salon',         label: 'Grand Salon' },
    { value: 'other',               label: 'Other' },
];

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

type DateEntry = {
    id: string;
    start_date: string;
    has_end_date: boolean;
    end_date: string;
};

type FormState = {
    submitter_name: string;
    submitter_email: string;
    title: string;
    dates: DateEntry[];
    location_key: string;
    custom_location: string;
    description: string;
    category: string;
    custom_category: string;
    contact_email: string;
    contact_phone: string;
    contact_name: string;
};

type FormErrors = {
    submitter_name?: string;
    submitter_email?: string;
    title?: string;
    dates?: string;
    date_start?: Record<string, string | undefined>;
    date_end?: Record<string, string | undefined>;
    location_key?: string;
    custom_location?: string;
    description?: string;
    category?: string;
    custom_category?: string;
    contact_email?: string;
};

const today = new Date();

function newDateEntry(): DateEntry {
    return { id: crypto.randomUUID(), start_date: '', has_end_date: false, end_date: '' };
}

const API_BASE = import.meta.env.DEV ? 'http://localhost:3000' : '';

export default function SubmitEvent() {
    const [formData, setFormData] = useState<FormState>({
        submitter_name: '',
        submitter_email: '',
        title: '',
        dates: [newDateEntry()],
        location_key: '',
        custom_location: '',
        description: '',
        category: '',
        custom_category: '',
        contact_email: '',
        contact_phone: '',
        contact_name: '',
    });

    const [formErrors, setFormErrors] = useState<FormErrors>({});

    const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
        setFormData(prev => ({ ...prev, [field]: value }));
        setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }

    function updateDate(id: string, changes: Partial<DateEntry>) {
        setFormData(prev => ({
            ...prev,
            dates: prev.dates.map(d => (d.id === id ? { ...d, ...changes } : d)),
        }));
        setFormErrors(prev => ({
            ...prev,
            date_start: { ...prev.date_start, [id]: undefined },
            date_end: { ...prev.date_end, [id]: undefined },
            dates: undefined,
        }));
    }

    function addDate() {
        setFormData(prev => ({ ...prev, dates: [...prev.dates, newDateEntry()] }));
    }

    function removeDate(id: string) {
        setFormData(prev => ({ ...prev, dates: prev.dates.filter(d => d.id !== id) }));
    }

    function validate(): boolean {
        const errs: FormErrors = {};
        let valid = true;

        if (!formData.submitter_name.trim()) {
            errs.submitter_name = 'Name is required'; valid = false;
        }
        if (!formData.submitter_email.trim()) {
            errs.submitter_email = 'Email is required'; valid = false;
        } else if (!formData.submitter_email.toLowerCase().endsWith('@ut.edu')) {
            errs.submitter_email = 'Must be a @ut.edu email address'; valid = false;
        }
        if (!formData.title.trim()) {
            errs.title = 'Event title is required'; valid = false;
        }

        if (formData.dates.length === 0) {
            errs.dates = 'At least one date is required'; valid = false;
        } else {
            const startErrors: Record<string, string> = {};
            const endErrors: Record<string, string> = {};
            formData.dates.forEach(d => {
                if (!d.start_date) {
                    startErrors[d.id] = 'Start date is required'; valid = false;
                } else if (new Date(d.start_date) < today) {
                    startErrors[d.id] = 'Date must be in the future'; valid = false;
                }
                if (d.has_end_date) {
                    if (!d.end_date) {
                        endErrors[d.id] = 'End date is required'; valid = false;
                    } else if (new Date(d.end_date) <= new Date(d.start_date)) {
                        endErrors[d.id] = 'End date must be after start date'; valid = false;
                    }
                }
            });
            if (Object.keys(startErrors).length) errs.date_start = startErrors;
            if (Object.keys(endErrors).length) errs.date_end = endErrors;
        }

        if (!formData.location_key) {
            errs.location_key = 'Location is required'; valid = false;
        }
        if (formData.location_key === 'other' && !formData.custom_location.trim()) {
            errs.custom_location = 'Please specify the location'; valid = false;
        }
        if (!formData.description.trim()) {
            errs.description = 'Description is required'; valid = false;
        }
        if (!formData.category) {
            errs.category = 'Category is required'; valid = false;
        }
        if (formData.category === 'Other' && !formData.custom_category.trim()) {
            errs.custom_category = 'Please specify the category'; valid = false;
        }
        if (!formData.contact_email.trim()) {
            errs.contact_email = 'Contact email is required'; valid = false;
        }

        setFormErrors(errs);
        return valid;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;

        setSubmitStatus('loading');

        const payload = {
            submitter_name: formData.submitter_name,
            submitter_email: formData.submitter_email,
            title: formData.title,
            dates: formData.dates.map(d => ({
                start_date: d.start_date,
                end_date: d.has_end_date ? d.end_date : null,
            })),
            location_key: formData.location_key,
            custom_location: formData.location_key === 'other' ? formData.custom_location : null,
            description: formData.description,
            category: formData.category === 'Other' ? formData.custom_category : formData.category,
            custom_category: formData.category === 'Other' ? formData.custom_category : null,
            contact_email: formData.contact_email,
            contact_phone: formData.contact_phone || null,
            contact_name: formData.contact_name || null,
        };

        try {
            const res = await fetch(`${API_BASE}/api/submit-event`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setSubmitStatus('success');
            } else {
                setSubmitStatus('error');
            }
        } catch {
            setSubmitStatus('error');
        }
    }

    if (submitStatus === 'success') {
        return (
            <div className="submit-event-page">
                <div className="submit-event-card">
                    <span className="subtitle">Thank You</span>
                    <h2>Event Submitted</h2>
                    <p className='body-large'>
                        Your event has been submitted and is pending review. You will be
                        contacted at <strong>{formData.submitter_email}</strong> if more information is required.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="submit-event-page">
            <div className="submit-event-card">
                <h1>Submit An Event</h1>
                <p className='body-large'>
                    Fill out the form below to submit your event for review. Once approved
                    by the administrator, it will appear on the Arts&amp;Ideas calendar.
                </p>

                <form className="event-form" onSubmit={handleSubmit} noValidate>

                    {/* ── About You ──────────────────────────────── */}
                    <Form.Section
                        title='About You'
                        divider={true}
                    >
                        <Form.Input
                            label='Your Name'
                            inputType='text'
                            inputName='submitter_name'
                            inputValue={formData.submitter_name}
                            onChange={e => updateField('submitter_name', e.target.value)}
                            inputInvalid={!!formErrors.submitter_name}
                        >
                            {formErrors.submitter_name && (
                                <Form.Error>{formErrors.submitter_name}</Form.Error>
                            )}
                        </Form.Input>
                        <Form.Input
                            label='UTampa Email Address'
                            inputType='email'
                            inputName='submitter_name'
                            inputValue={formData.submitter_email}
                            placeholder="example@ut.edu"
                            onChange={e => updateField('submitter_email', e.target.value)}
                            inputInvalid={!!formErrors.submitter_email}
                        >
                            <Form.Hint>Used to contact you about your submission.</Form.Hint>
                            {formErrors.submitter_email && (
                                <Form.Error>{formErrors.submitter_email}</Form.Error>
                            )}
                        </Form.Input>
                    </Form.Section>
                    {/* <section className="form-section">
                        <h4 className="form-section-title">About You</h4>

                        <div className="form-field">
                            <label htmlFor="submitter_name">Your Name</label>
                            <input
                                id="submitter_name"
                                type="text"
                                value={formData.submitter_name}
                                onChange={e => updateField('submitter_name', e.target.value)}
                                aria-invalid={!!formErrors.submitter_name}
                                aria-describedby={formErrors.submitter_name ? 'err-submitter_name' : undefined}
                            />
                            {formErrors.submitter_name && (
                                <span id="err-submitter_name" className="form-error" role="alert">
                                    {formErrors.submitter_name}
                                </span>
                            )}
                        </div>

                        <div className="form-field">
                            <label htmlFor="submitter_email">UTampa Email Address</label>
                            <input
                                id="submitter_email"
                                type="email"
                                placeholder="example@ut.edu"
                                value={formData.submitter_email}
                                onChange={e => updateField('submitter_email', e.target.value)}
                                aria-invalid={!!formErrors.submitter_email}
                                aria-describedby={formErrors.submitter_email ? 'err-submitter_email' : 'hint-submitter_email'}
                            />
                            
                            {formErrors.submitter_email && (
                                <span id="err-submitter_email" className="form-error" role="alert">
                                    {formErrors.submitter_email}
                                </span>
                            )}
                        </div>
                    </section> */}

                    {/* <hr className="form-divider" /> */}

                    {/* ── Event Details ──────────────────────────── */}
                    <Form.Section
                        title="Event Details"
                    >
                        <Form.Input
                            label='Event Title'
                            inputType='text'
                            inputName='title'
                            inputValue={formData.title}
                            onChange={e => updateField('title', e.target.value)}
                            inputInvalid={!!formErrors.title}
                        >
                            {formErrors.title && <Form.Error>{formErrors.title}</Form.Error>}
                        </Form.Input>
                        <Form.Fieldset legend='Date(s)'>
                            <div className="form-dates-list">
                                {formData.dates.map((entry, idx) => (
                                    <div key={entry.id} className="form-date-entry">
                                        <div className="form-date-row">
                                            <Form.Input 
                                                label={`${entry.has_end_date ? 'Start Date' : 'Date'}${formData.dates.length > 1 ? ` ${idx + 1}` : ''}`}
                                                id = {`start_${entry.id}`}
                                                inputType="datetime-local"
                                                inputName='start_date'
                                                min={today.toISOString()}
                                                inputValue={entry.start_date} 
                                                onChange={e => updateDate(entry.id, { start_date: e.target.value })}
                                                inputInvalid={!!formErrors.date_start?.[entry.id]}
                                            >
                                                {formErrors.date_start?.[entry.id] && <Form.Error>{formErrors.date_start[entry.id]}</Form.Error>}
                                            </Form.Input>
                                            {entry.has_end_date && (
                                                <Form.Input 
                                                    label='End Date'
                                                    id = {`end_${entry.id}`}
                                                    inputType="datetime-local"
                                                    inputName='end_date'
                                                    min={entry.start_date || today.toISOString()}
                                                    inputValue={entry.end_date}
                                                    onChange={e => updateDate(entry.id, { end_date: e.target.value })}
                                                    inputInvalid={!!formErrors.date_end?.[entry.id]}
                                                >
                                                    {formErrors.date_end?.[entry.id] && <Form.Error>{formErrors.date_end[entry.id]}</Form.Error>}
                                                </Form.Input>
                                            )}
                                            {/* <div className="form-field">
                                                <label className="small form-label-muted" htmlFor={`start_${entry.id}`}>
                                                    {entry.has_end_date ? 'Start Date' : 'Date'}
                                                    {formData.dates.length > 1 && ` ${idx + 1}`}
                                                </label>
                                                <input
                                                    id={`start_${entry.id}`}
                                                    type="datetime-local"
                                                    min={today.toISOString()}
                                                    value={entry.start_date}
                                                    onChange={e => updateDate(entry.id, { start_date: e.target.value })}
                                                    aria-invalid={!!formErrors.date_start?.[entry.id]}
                                                />
                                                {formErrors.date_start?.[entry.id] && (
                                                    <span className="form-error" role="alert">
                                                        {formErrors.date_start[entry.id]}
                                                    </span>
                                                )}
                                            </div> */}

                                            {/* {entry.has_end_date && (
                                                <div className="form-field">
                                                    <label className="small form-label-muted" htmlFor={`end_${entry.id}`}>
                                                        End Date
                                                    </label>
                                                    <input
                                                        id={`end_${entry.id}`}
                                                        type="datetime-local"
                                                        min={entry.start_date || today.toISOString()}
                                                        value={entry.end_date}
                                                        onChange={e => updateDate(entry.id, { end_date: e.target.value })}
                                                        aria-invalid={!!formErrors.date_end?.[entry.id]}
                                                    />
                                                    {formErrors.date_end?.[entry.id] && (
                                                        <span className="form-error" role="alert">
                                                            {formErrors.date_end[entry.id]}
                                                        </span>
                                                    )}
                                                </div>
                                            )} */}
                                        </div>

                                        <div className="form-date-actions">
                                            <Form.Checkbox
                                                checked={entry.has_end_date}
                                                onChange={e =>
                                                    updateDate(entry.id, {
                                                        has_end_date: e.target.checked,
                                                        end_date: '',
                                                    })}
                                            >
                                                Date range
                                            </Form.Checkbox>
                                            {formData.dates.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="btn-remove-date"
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
                            <button type="button" className="btn-add-date" onClick={addDate}>
                                + Add another date
                            </button>
                        </Form.Fieldset>
                        <Form.Select
                            label='Location'
                            id='location_key'
                            inputName='location_key'
                            inputValue={formData.location_key}
                            inputInvalid={!!formErrors.location_key}
                            placeholder='Select a location'
                            onChange={e => updateField('location_key', e.target.value)}
                            options={LOCATION_OPTIONS}
                        >
                            {formErrors.location_key && <Form.Error>{formErrors.location_key}</Form.Error>}
                        </Form.Select>
                        {formData.location_key === 'other' && (
                            <div className="form-field">
                                <label htmlFor="custom_location">Specify Location</label>
                                <input
                                    id="custom_location"
                                    type="text"
                                    value={formData.custom_location}
                                    onChange={e => updateField('custom_location', e.target.value)}
                                    aria-invalid={!!formErrors.custom_location}
                                />
                                {formErrors.custom_location && (
                                    <span className="form-error" role="alert">{formErrors.custom_location}</span>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        <div className="form-field">
                            <label htmlFor="description">Event Description</label>
                            <textarea
                                id="description"
                                rows={10}
                                value={formData.description}
                                onChange={e => updateField('description', e.target.value)}
                                aria-invalid={!!formErrors.description}
                            />
                            {formErrors.description && (
                                <span className="form-error" role="alert">{formErrors.description}</span>
                            )}
                        </div>

                        {/* Category */}
                        <div className="form-field">
                            <label htmlFor="category">Category</label>
                            <select
                                id="category"
                                value={formData.category}
                                onChange={e => updateField('category', e.target.value)}
                                aria-invalid={!!formErrors.category}
                            >
                                <option value="" disabled>Select a category</option>
                                {CATEGORY_OPTIONS.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            {formErrors.category && (
                                <span className="form-error" role="alert">{formErrors.category}</span>
                            )}
                        </div>

                        {formData.category === 'Other' && (
                            <div className="form-field">
                                <label htmlFor="custom_category">Specify Category</label>
                                <input
                                    id="custom_category"
                                    type="text"
                                    value={formData.custom_category}
                                    onChange={e => updateField('custom_category', e.target.value)}
                                    aria-invalid={!!formErrors.custom_category}
                                />
                                {formErrors.custom_category && (
                                    <span className="form-error" role="alert">{formErrors.custom_category}</span>
                                )}
                            </div>
                        )}
                    </Form.Section>

                    {/* <section className="form-section">
                        <h4 className="form-section-title">Event Details</h4>

                        <div className="form-field">
                            <label className="label" htmlFor="title">Event Title</label>
                            <input
                                id="title"
                                type="text"
                                value={formData.title}
                                onChange={e => updateField('title', e.target.value)}
                                aria-invalid={!!formErrors.title}
                                aria-describedby={formErrors.title ? 'err-title' : undefined}
                            />
                            {formErrors.title && (
                                <span id="err-title" className="form-error" role="alert">
                                    {formErrors.title}
                                </span>
                            )}
                        </div> */}

                        {/* Dates */}
                        {/* <fieldset className="form-field form-dates-fieldset">
                            <legend><h3>Date(s)</h3></legend>
                            {formErrors.dates && (
                                <span className="form-error" role="alert">{formErrors.dates}</span>
                            )}
                            <div className="form-dates-list">
                                {formData.dates.map((entry, idx) => (
                                    <div key={entry.id} className="form-date-entry">
                                        <div className="form-date-row">
                                            <div className="form-field">
                                                <label className="small form-label-muted" htmlFor={`start_${entry.id}`}>
                                                    {entry.has_end_date ? 'Start Date' : 'Date'}
                                                    {formData.dates.length > 1 && ` ${idx + 1}`}
                                                </label>
                                                <input
                                                    id={`start_${entry.id}`}
                                                    type="datetime-local"
                                                    min={today.toISOString()}
                                                    value={entry.start_date}
                                                    onChange={e => updateDate(entry.id, { start_date: e.target.value })}
                                                    aria-invalid={!!formErrors.date_start?.[entry.id]}
                                                />
                                                {formErrors.date_start?.[entry.id] && (
                                                    <span className="form-error" role="alert">
                                                        {formErrors.date_start[entry.id]}
                                                    </span>
                                                )}
                                            </div>

                                            {entry.has_end_date && (
                                                <div className="form-field">
                                                    <label className="small form-label-muted" htmlFor={`end_${entry.id}`}>
                                                        End Date
                                                    </label>
                                                    <input
                                                        id={`end_${entry.id}`}
                                                        type="datetime-local"
                                                        min={entry.start_date || today.toISOString()}
                                                        value={entry.end_date}
                                                        onChange={e => updateDate(entry.id, { end_date: e.target.value })}
                                                        aria-invalid={!!formErrors.date_end?.[entry.id]}
                                                    />
                                                    {formErrors.date_end?.[entry.id] && (
                                                        <span className="form-error" role="alert">
                                                            {formErrors.date_end[entry.id]}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="form-date-actions">
                                            <label className="form-checkbox-label small">
                                                <input
                                                    type="checkbox"
                                                    checked={entry.has_end_date}
                                                    onChange={e =>
                                                        updateDate(entry.id, {
                                                            has_end_date: e.target.checked,
                                                            end_date: '',
                                                        })
                                                    }
                                                />
                                                Date range
                                            </label>
                                            {formData.dates.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="btn-remove-date"
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
                            <button type="button" className="btn-add-date" onClick={addDate}>
                                + Add another date
                            </button>
                        </fieldset> */}

                        {/* Location */}
                        ?

                        {/* Description */}
                        {/* <div className="form-field">
                            <label htmlFor="description">Event Description</label>
                            <textarea
                                id="description"
                                rows={10}
                                value={formData.description}
                                onChange={e => updateField('description', e.target.value)}
                                aria-invalid={!!formErrors.description}
                            />
                            {formErrors.description && (
                                <span className="form-error" role="alert">{formErrors.description}</span>
                            )}
                        </div> */}

                        {/* Category */}
                        {/* <div className="form-field">
                            <label htmlFor="category">Category</label>
                            <select
                                id="category"
                                value={formData.category}
                                onChange={e => updateField('category', e.target.value)}
                                aria-invalid={!!formErrors.category}
                            >
                                <option value="" disabled>Select a category</option>
                                {CATEGORY_OPTIONS.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            {formErrors.category && (
                                <span className="form-error" role="alert">{formErrors.category}</span>
                            )}
                        </div>

                        {formData.category === 'Other' && (
                            <div className="form-field">
                                <label htmlFor="custom_category">Specify Category</label>
                                <input
                                    id="custom_category"
                                    type="text"
                                    value={formData.custom_category}
                                    onChange={e => updateField('custom_category', e.target.value)}
                                    aria-invalid={!!formErrors.custom_category}
                                />
                                {formErrors.custom_category && (
                                    <span className="form-error" role="alert">{formErrors.custom_category}</span>
                                )}
                            </div>
                        )}
                    </section> */}

                    <hr className="form-divider" />

                    {/* ── Contact Information ────────────────────── */}
                    <section className="form-section">
                        <h4>Contact Information</h4>
                        <p>Public-facing contact details for this event.</p>

                        <div className="form-field">
                            <label className="label" htmlFor="contact_email">Contact Email</label>
                            <input
                                id="contact_email"
                                type="email"
                                value={formData.contact_email}
                                onChange={e => updateField('contact_email', e.target.value)}
                                aria-invalid={!!formErrors.contact_email}
                            />
                            {formErrors.contact_email && (
                                <span className="form-error" role="alert">{formErrors.contact_email}</span>
                            )}
                        </div>

                        <div className="form-field">
                            <label className="label" htmlFor="contact_phone">
                                Contact Phone <span className="form-optional subtle">(Optional)</span>
                            </label>
                            <input
                                id="contact_phone"
                                type="tel"
                                value={formData.contact_phone}
                                onChange={e => updateField('contact_phone', e.target.value)}
                            />
                        </div>

                        <div className="form-field">
                            <label className="label" htmlFor="contact_name">
                                Contact Name <span className="form-optional subtle">(Optional)</span>
                            </label>
                            <input
                                id="contact_name"
                                type="text"
                                value={formData.contact_name}
                                onChange={e => updateField('contact_name', e.target.value)}
                            />
                        </div>
                    </section>

                    <div className="form-submit-row">
                        {submitStatus === 'error' && (
                            <p className="form-error" role="alert">
                                Something went wrong. Please try again.
                            </p>
                        )}
                        <button type="submit" disabled={submitStatus === 'loading'}>
                            {submitStatus === 'loading' ? 'Submitting...' : 'Submit Event'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
