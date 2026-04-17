import { ChangeEvent, ReactNode } from "react"

type FormSelectProps = {
    children?: ReactNode
    label: string,
    id?: string,
    inputName: string,
    inputValue: string,
    placeholder?: string,
    onChange: (e: ChangeEvent<HTMLSelectElement>) => void,
    inputInvalid?: boolean,
    required?: boolean,
    options: {
        value: string,
        label: string
    }[]
}

export default function FormSelect({
    children,
    label,
    id = '',
    inputName,
    inputValue,
    placeholder = '',
    onChange,
    inputInvalid = false,
    required = true,
    options = []
    }:FormSelectProps) {
        
    const inputId:string = id ? id : inputName.toLowerCase().replace(' ', '_')

    return (
        <div className="form-field">
            <label htmlFor={inputId}>{label}</label>
            <select
                id={inputId}
                name={inputName}
                value={inputValue}
                onChange={onChange}
                aria-invalid={inputInvalid}
                className={inputInvalid ? 'invalid' : ''}
                required={required}
            >
                <option value="" disabled>{placeholder}</option>
                {options.map(option => (
                    <option 
                        key={option.value}
                        value={option.value}>
                            {option.label}
                    </option>
                ))}
            </select>
            {children}
        </div>
        
    )
}
