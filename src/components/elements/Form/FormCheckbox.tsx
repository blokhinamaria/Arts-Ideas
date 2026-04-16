import { ChangeEvent, ReactNode } from "react"

type FormCheckboxProps = {
    children: ReactNode,
    checked:boolean,
    onChange: (e: ChangeEvent<HTMLInputElement>) => void,
}

export default function FormCheckbox({children, checked, onChange}:FormCheckboxProps) {
    return (
        <label className="form-checkbox-label small">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
            />
            {children}
        </label>
    )
}