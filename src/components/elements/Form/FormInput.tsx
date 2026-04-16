import { ChangeEvent, ReactNode } from "react"

type FormInputProps = {
    children?: ReactNode
    label: string,
    id?: string,
    inputType: 'text' | 'password' | 'email' | 'datetime-local',
    inputName: string,
    inputValue: string,
    placeholder?: string,
    min?: string,
    onChange: (e: ChangeEvent<HTMLInputElement>) => void,
    inputInvalid?: boolean,
    required?: boolean
}

export default function FormInput({
    children,
    label,
    id = '',
    inputType = 'text',
    inputName,
    inputValue,
    placeholder = '',
    min = '',
    onChange,
    inputInvalid = false,
    required = true
    }:FormInputProps) {
        
    const inputId:string = id ? id : label.toLowerCase().replace(' ', '_')

    return (
        <div className="form-field">
            <label htmlFor={inputId}>{label}</label>
            <input
                id={inputId}
                name={inputName}
                aria-label={label}
                aria-required={required}
                type={inputType}
                placeholder={placeholder}
                min={min}
                value={inputValue}
                onChange={onChange}
                required={required}
                className={inputInvalid ? 'invalid' : ''}
                aria-invalid={inputInvalid}
                >
            </input>
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
