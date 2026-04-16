import { ReactNode } from "react"

type FormHint = {
    children: ReactNode
}

export default function FormHint({children}:FormHint)  {
    return (
        <span id="hint-submitter_email" className="form-hint">
            {children}
        </span>
    )
}