type SubmitButtonProps = {
    buttonText: string,
    inProgress?: string,
    disabled?: boolean
}

export default function FormSubmitButton({ buttonText = "submit", inProgress, disabled=false }:SubmitButtonProps) {
    return (
        <button
            type='submit'
            disabled={disabled}>
                {(disabled && inProgress) ? inProgress : buttonText}
        </button>
    )
}