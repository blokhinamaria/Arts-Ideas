export default function EventTitleGroup({title}:{title:string}) {
    
    return (
        <div className='default-event-header-group'>
            <h3 className="secondary-title">{title}</h3>
            {/* <button className='add-to-calendar-icon'>
                    <span className="material-symbols-outlined">
                        calendar_add_on
                    </span>
                </button> */}
        </div>
    )
}
