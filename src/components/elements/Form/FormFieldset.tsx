import { ReactNode } from "react"

type FormFieldset = {
    children: ReactNode,
    legend: string,
    onAdd: () => void,
    addButtonText: string
}

export default function FormFieldset({
    children,
    legend,
    onAdd,
    addButtonText,
}: FormFieldset) {
    return (
        <fieldset className="form-field form-fieldset">
            <legend><h3>{legend}</h3></legend>
            {children}
            <button type="button" className="btn-add" onClick={onAdd}>
                {addButtonText}
            </button>
        </fieldset>
    )
}