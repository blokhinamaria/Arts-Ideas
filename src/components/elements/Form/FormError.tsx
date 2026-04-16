import { ReactNode } from "react"

type FormErrorProps = {
    children: ReactNode
}

export default function FormError({children}:FormErrorProps) {
    return (
        <span id="err-submitter_name" className="form-error" role="alert">
            {children}
        </span>
    )
}