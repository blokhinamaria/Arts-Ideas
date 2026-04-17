import { ChangeEventHandler, ReactNode } from "react"

type FormTextareaProps = {
    children?: ReactNode
    label: string,
    id?: string,
    inputName: string,
    inputValue: string,
    placeholder?: string,
    rows?: number,
    onChange: ChangeEventHandler<HTMLTextAreaElement>,
    inputInvalid?: boolean,
    required?: boolean
}

export default function FormTextarea({
    children,
    label,
    id = '',
    inputName,
    inputValue,
    placeholder = '',
    rows = 10,
    onChange,
    inputInvalid = false,
    required = true
    }:FormTextareaProps) {
        
    const inputId:string = id ? id : inputName.toLowerCase().replace(' ', '_')

    return (
        <div className="form-field">
            <label htmlFor={inputId}>{label}</label>
            <textarea
                id={inputId}
                name={inputName}
                aria-label={label}
                aria-required={required}
                required={required}
                placeholder={placeholder}
                rows={rows}
                value={inputValue}
                onChange={onChange}
                className={inputInvalid ? 'invalid' : ''}
                aria-invalid={inputInvalid}
            />
            {children}
        </div>
    )
}

// label='username'
// inputType='text'
// inputName='username'
// inputValue={formData.username}
// onChange={handleChange}
// inputInvalid={invalidEmail}
