import { useEffect, useRef, useState } from 'react';
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
    { value: 'Music Performance', label: 'Music Performance' },
    { value: 'Theatre / Drama', label: 'Theatre / Drama' },
    { value: 'Dance', label: 'Dance' },
    { value: 'Visual Arts', label: 'Visual Arts' },
    { value: 'Film / Screening', label: 'Film / Screening' },
    { value: 'Lecture / Talk', label: 'Lecture / Talk' },
    { value: 'Workshop / Master Class', label: 'Workshop / Master Class' },
    { value: 'Gallery Exhibition', label: 'Gallery Exhibition' },
    { value: 'Literary Arts / Reading', label: 'Literary Arts / Reading' },
    { value: 'Interdisciplinary', label: 'Interdisciplinary' },
    { value: 'Other', label: 'Other' }
];

export type DateEntry = {
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
    const successRef = useRef<HTMLDivElement>(null);
    const newData:FormState = {
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
    }
    const [formData, setFormData] = useState<FormState>(newData);

    const [formErrors, setFormErrors] = useState<FormErrors>({});

    const [ locationOptions, setLocationOptions ] = useState<
        {
            value: string,
            label: string,
        }[]>([])
    
    useEffect(() => {
        getLocations()
    }, [])

    async function getLocations() {
        const other = {
            value: 'other',
            label: 'Other'
        }
        try {
            const response = await fetch(`${API_BASE}/api/locations`)
            if (!response.ok) {
                throw Error
            }
            const data: { key:string, venue: string, building: string, address:string }[] = await response.json()
            const locations = data.map(location => ({
                    value: location.key,
                    label: location.building !== null ? `${location.venue}, ${location.building}` : `${location.venue}`
                }
            ))
            locations.push(other)
            setLocationOptions(locations)
        } catch (err) {
            console.log(err)
            setLocationOptions([])
            setFormErrors(prev => ({...prev, location_key: 'Failed to load available locations. Try again later'}))
        }
    }

    const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [ formErrorMessage, setFormErrorMessage] = useState<string>('')

    useEffect(() => {
        if (submitStatus === 'success') {
            successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [submitStatus]);

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
        } else if (!formData.contact_email.toLowerCase().endsWith('@ut.edu')) {
            errs.contact_email = 'Must be a @ut.edu email address'; valid = false;
        }

        setFormErrors(errs);
        return valid;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) {
            setSubmitStatus('error')
            setFormErrorMessage('Your information has invalid input. Please check your information and submit again.')
            return
        }

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
            setFormErrorMessage('Something went wrong. Please try again.')
        }
    }

    function handleSubmitAnother() {
        console.log('clicked')
        setSubmitStatus('idle')
        setFormData(newData)
    }

    if (submitStatus === 'success') {
        return (
            <div className="submit-event-page" ref={successRef}>
                <div className="submit-event-card" >
                    <span className="subtitle">Thank You</span>
                    <h2>Event Submitted</h2>
                    <p className='body-large'>
                        Your event has been submitted and is pending review. You will be
                        contacted at <strong>{formData.submitter_email}</strong> if more information is required.
                    </p>
                    <button onClick={handleSubmitAnother}>Submit another event</button>
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

                <Form
                    onSubmit={handleSubmit}
                    errorMessage={submitStatus === 'error' ? formErrorMessage : null}
                >

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
                    
                    <Form.Section
                        title="Event Details"
                        divider={true}
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
                        <Form.Fieldset
                            legend='Date(s)'
                            onAdd={addDate}
                            addButtonText='+ Add another date'
                        >
                            {formData.dates.map((entry, idx) => (
                                <Form.DateEntry
                                    key={entry.id}
                                    index={idx}
                                    length={formData.dates.length}
                                    checked={entry.has_end_date}
                                    onCheck={e =>
                                        updateDate(entry.id, {
                                            has_end_date: e.target.checked,
                                            end_date: '',
                                        })}
                                    onRemove={() => removeDate(entry.id)}
                                >
                                    <Form.Input 
                                            label={`${entry.has_end_date ? 'Start Date' : 'Date'}${formData.dates.length > 1 ? ` ${idx + 1}` : ''}`}
                                            id = {`start_${entry.id}`}
                                            inputType="datetime-local"
                                            inputName='start_date'
                                            inputValue={entry.start_date} 
                                            onChange={e => updateDate(entry.id, { start_date: e.target.value })}
                                            inputInvalid={!!formErrors.date_start?.[entry.id]}
                                            min={today.toISOString()}
                                        >
                                            {formErrors.date_start?.[entry.id] && <Form.Error>{formErrors.date_start[entry.id]}</Form.Error>}
                                        </Form.Input>
                                        {entry.has_end_date && (
                                            <Form.Input 
                                                label='End Date'
                                                id = {`end_${entry.id}`}
                                                inputType="datetime-local"
                                                inputName='end_date'
                                                inputValue={entry.end_date}
                                                onChange={e => updateDate(entry.id, { end_date: e.target.value })}
                                                inputInvalid={!!formErrors.date_end?.[entry.id]}
                                                min={entry.start_date || today.toISOString()}
                                            >
                                                {formErrors.date_end?.[entry.id] && <Form.Error>{formErrors.date_end[entry.id]}</Form.Error>}
                                            </Form.Input>
                                        )}
                                </Form.DateEntry>
                            ))}
                        </Form.Fieldset>

                        {/* Location */}
                        <Form.Select
                            label='Location'
                            inputName='location_key'
                            inputValue={formData.location_key}
                            inputInvalid={!!formErrors.location_key}
                            placeholder='Select a location'
                            onChange={e => updateField('location_key', e.target.value)}
                            options={locationOptions}
                        >
                            {formErrors.location_key && <Form.Error>{formErrors.location_key}</Form.Error>}
                        </Form.Select>
                        {formData.location_key === 'other' && (
                            <Form.Input
                                label='Specify Location'
                                inputName='custom_location'
                                inputValue={formData.custom_location}
                                onChange={e => updateField('custom_location', e.target.value)}
                                inputInvalid = {!!formErrors.custom_location}
                            >
                                {formErrors.custom_location && (
                                    <Form.Error>{formErrors.custom_location}</Form.Error>
                                )}
                            </Form.Input>
                        )}

                        {/* Description */}
                        <Form.Textarea
                            label='Event Description'
                            inputName='description'
                            inputValue={formData.description}
                            inputInvalid={!!formErrors.description}
                            onChange={e => updateField('description', e.target.value)}
                        >
                            {formErrors.description && (
                                <Form.Error>{formErrors.description}</Form.Error>
                            )}
                        </Form.Textarea>

                        {/* Category */}
                        <Form.Select
                            label='Category'
                            inputName='category'
                            inputValue={formData.category}
                            inputInvalid={!!formErrors.category}
                            placeholder='Select a category'
                            onChange={e => updateField('category', e.target.value)}
                            options={CATEGORY_OPTIONS}
                        >
                            {formErrors.category && <Form.Error>{formErrors.category}</Form.Error>}
                        </Form.Select>
                        {formData.category === 'Other' && (
                            <Form.Input
                                label='Specify Category'
                                inputName='custom_category'
                                inputValue={formData.custom_category}
                                onChange={e => updateField('custom_category', e.target.value)}
                                inputInvalid = {!!formErrors.custom_category}
                            >
                                {formErrors.custom_category && (
                                    <Form.Error>{formErrors.custom_category}</Form.Error>
                                )}
                            </Form.Input>
                        )}
                    </Form.Section>

                    {/* ── Contact Information ────────────────────── */}
                    <Form.Section
                        title='Contact Information'
                    >
                        <p>Public-facing contact details for this event.</p>
                        <Form.Input
                            label='Contact Email'
                            inputName='contact_email'
                            inputValue={formData.contact_email}
                            onChange={e => updateField('contact_email', e.target.value)}
                            inputType='email'
                            inputInvalid={!!formErrors.contact_email}
                        >
                            {formErrors.contact_email && (
                                <Form.Error>{formErrors.contact_email}</Form.Error>
                            )}
                        </Form.Input>
                        <Form.Input
                            label='Contact Phone'
                            inputName='contact_phone'
                            inputValue={formData.contact_phone}
                            onChange={e => updateField('contact_phone', e.target.value)}
                            inputType='tel'
                            required={false}
                            maxLength="10"
                        >
                        </Form.Input>
                        <Form.Input
                            label='Contact Name'
                            inputName='contact_name'
                            inputValue={formData.contact_name}
                            onChange={e => updateField('contact_name', e.target.value)}
                            required={false}
                        >
                        </Form.Input>
                    </Form.Section>
                    <Form.SubmitButton
                            buttonText='Submit Event'
                            inProgress='Submitting...'
                            disabled={submitStatus === 'loading'}
                        />
                </Form>
            </div>
        </div>
    );
}
