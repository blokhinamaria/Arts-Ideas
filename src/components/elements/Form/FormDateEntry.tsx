
import { ChangeEvent, ReactNode } from "react"
import Form from "./Form"

type FormDateEntryProps = {
    children: ReactNode
    index: number,
    length: number,
    checked: boolean,
    onCheck: (e: ChangeEvent<HTMLInputElement>) => void,
    onRemove: () => void
}

export default function FormDateEntry({
    children,
    index,
    length,
    checked,
    onCheck,
    onRemove
}:FormDateEntryProps) {
    
    
    return (
        <div className="form-date-entry">
            <div className="form-date-row">
                {children}
            </div>
            <div className="form-date-actions">
                <Form.Checkbox
                    checked={checked}
                    onChange={onCheck}
                >
                    Date range
                </Form.Checkbox>
                {length > 1 && (
                    <button
                        type="button"
                        className="btn-remove-date"
                        onClick={onRemove}
                        aria-label={`Remove date ${index + 1}`}
                    >
                        Remove
                    </button>
                )}
            </div>
        </div>
    )
}