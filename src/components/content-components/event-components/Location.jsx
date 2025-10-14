export default function Location({event}) {
    return (
        <p className='body-large'>
                {event.location?.venue}
                {event.location?.building ? <><br/>{event.location?.building}</> : ''}
        </p>
    )
}