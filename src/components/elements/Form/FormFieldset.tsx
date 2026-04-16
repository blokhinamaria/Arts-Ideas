import { ReactNode } from "react"

type FormFieldset = {
    children: ReactNode,
    legend: string
}

export default function FormFieldset({children, legend}: FormFieldset) {
    return (
        <fieldset className="form-field form-dates-fieldset">
            <legend><h3>{legend}</h3></legend>
            {children}
        </fieldset>
    )
}