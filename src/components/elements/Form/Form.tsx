import type { ReactNode, FC, FormEvent } from 'react';
import FormInput from './FormInput';
import FormSubmitButton from './FormSubmitButton';
import FormSection from './FormSection';
import FormFieldset from './FormFieldset';
import FormError from './FormError';
import FormHint from './FormHint';
import FormCheckbox from './FormCheckbox';
import FormSelect from './FormSelect';

import './form.css'

type FormProps = {
    children: ReactNode,
    onSubmit: (e: FormEvent<Element>) => Promise<void>,
    errorMessage?: string | null
}

type FormComponent = FC<FormProps> & {
    Input: typeof FormInput,
    SubmitButton: typeof FormSubmitButton,
    Section: typeof FormSection,
    Fieldset: typeof FormFieldset
    Error: typeof FormError,
    Hint: typeof FormHint,
    Checkbox: typeof FormCheckbox,
    Select: typeof FormSelect
};

const Form = function Form({children, onSubmit, errorMessage = null}:FormProps) {
    return (
        <form onSubmit={onSubmit}>
            {children}
            { errorMessage &&
                <p
                    aria-live='polite'
                    className='error-message'>
                        {errorMessage}
                </p>
                }
        </form>
    )
} as FormComponent;

Form.Input = FormInput
Form.SubmitButton = FormSubmitButton
Form.Section = FormSection
Form.Fieldset = FormFieldset
Form.Error = FormError
Form.Hint = FormHint
Form.Checkbox = FormCheckbox
Form.Select = FormSelect

export default Form;