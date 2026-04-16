import { ReactNode } from "react"

type FormProps = {
    children: ReactNode,
    title: string | null,
    divider?: boolean
}

export default function FormSection({
    children, 
    title = null,
    divider = false
}:FormProps) {
    return (
        <>
            <section className="form-section">
                {title && <h4 className="form-section-title">{title}</h4>}
                {children}
            </section>
            {divider && <hr className="form-divider" />}
        </>
    )
}