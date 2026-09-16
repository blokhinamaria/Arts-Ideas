import { useEffect, useState } from 'react';
import { LocationOption } from '../SubmitEvent';
import Form from '../../elements/Form/Form';
import { EditForm, FormErrors } from '../admin-components/PendingEventModal';

export type Location = {
    location_key: string;
    venue: string;
    building: string | null;
    address: string;
    map_url: string;
};

type LocationFieldsProps = {
    form: EditForm;
    setForm: React.Dispatch<React.SetStateAction<EditForm>>;
    errors: FormErrors;
    setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
};

export default function LocationFields({
    form,
    errors,
    setForm,
    setErrors,
}: LocationFieldsProps) {
    const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);

    useEffect(() => {
        async function getLocations() {
            try {
                const response = await fetch(`${import.meta.env.DEV ? 'http://localhost:3000' : ''}/api/locations`);
                if (!response.ok) {
                    throw Error;
                }
                const data: { id: number; key: string; venue: string; building: string; address: string }[] = await response.json();
                const locations = data.map((location) => ({
                    id: location.id,
                    key: location.key,
                    value: location.id,
                    label: location.building !== null ? `${location.venue}, ${location.building}` : `${location.venue}`,
                }));
                setLocationOptions(locations);
            } catch {
                setLocationOptions([]);
            }
        }
        getLocations();
    }, []);

    function updateLocationId(field: keyof FormErrors, value: string) {
        const location = locationOptions.find((loc) => loc.id === Number(value));
        if (location) {
            setForm((prev) => ({
                ...prev,
                location_id: location.id,
                location_key: location.key,
            }));
        }
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    function updateLocation<K extends keyof Location>(locationField: K, value: Location[K]) {
        setForm((prev) => ({
            ...prev,
            location: {
                ...prev.location,
                [locationField]: value,
            },
        }));

        if (locationField === 'venue' || locationField === 'building') {
            setErrors((prev) => ({ ...prev, venue: undefined, building: undefined }));
        }
        setErrors((prev) => ({ ...prev, [locationField]: undefined }));
    }

    return (
        <>
            <Form.Select
                label='Location'
                id="pe-location"
                inputName='pe-location'
                inputValue={form.location_id}
                inputInvalid={!!errors.location_id}
                placeholder='Select a location'
                onChange={(e) => updateLocationId('location_id', e.target.value)}
                options={locationOptions}
            >
                {errors.location_id && <span className="edit-error" role="alert">{errors.location_id}</span>}
            </Form.Select>
            {form.location_key === 'other' && (
                <>
                    <Form.Input
                        label='Venue Name'
                        inputName='venue'
                        inputValue={form.location.venue ?? ''}
                        onChange={e => updateLocation('venue', e.target.value)}
                        inputInvalid={!!errors.venue}
                        placeholder='Grand Salon'
                    >
                        <Form.Hint>If the venue is not named after the building it's in, please specify the building name below</Form.Hint>
                        {errors.venue && (
                            <Form.Error>{errors.venue}</Form.Error>
                        )}
                    </Form.Input>
                    <Form.Input
                        label='Building Name'
                        inputName='building'
                        inputValue={form.location.building ?? ''}
                        onChange={e => updateLocation('building', e.target.value)}
                        inputInvalid={!!errors.building}
                        placeholder='Plant Hall'
                        required={false}
                    >
                        {errors.building && (
                            <Form.Error>{errors.building}</Form.Error>
                        )}
                    </Form.Input>
                    <Form.Input
                        label='Address'
                        inputName='address'
                        inputValue={form.location.address ?? ''}
                        onChange={e => updateLocation('address', e.target.value)}
                        inputInvalid={!!errors.address}
                        placeholder='401 W Kennedy Blvd, Tampa, FL 33606'
                    >
                        {errors.address && (
                            <Form.Error>{errors.address}</Form.Error>
                        )}
                    </Form.Input>
                    <Form.Input
                        label='Map URL'
                        inputName='map_url'
                        inputValue={form.location.map_url ?? ''}
                        onChange={e => updateLocation('map_url', e.target.value)}
                        inputInvalid={!!errors.map_url}
                        placeholder='https://maps.app.goo.gl/z3b2qd8YsfeBwbAq7'
                    >
                        {errors.map_url && (
                            <Form.Error>{errors.map_url}</Form.Error>
                        )}
                    </Form.Input>
                </>
            )}
        </>
    );
}
