
export default function EventTitleGroup({event}) {
    return (
        <div className='default-event-header-group'>
                <h5>{event.title}</h5>
                    {/* <button className='add-to-calendar-icon'>
                            <span className="material-symbols-outlined">
                                calendar_add_on
                            </span>
                        </button> */}
        </div>
    )
}