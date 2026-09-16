import { Link } from 'react-router-dom'
import type {ReactNode} from 'react'
import type {EventLocationType} from './EventCard'

export default function EventLocation({location}:{location:EventLocationType}) {

    const LinkWrapper = ({children}: {children: ReactNode}) => location?.map_url ?
        <Link
            className="address"
            // to={`/campus-map?location=${location?.location_key}`}
            to={location?.map_url}
            target="_blank"
            aria-label="View on campus map"
            title="View on Google Maps"
        >{children}</Link>
        : <div className="address"> {children}</div>
    

    return (
        <LinkWrapper
        >
            <p className='body-large'>
                {location?.venue}
                {location?.building ? <><br/>{location?.building}</> : ''}
            </p>
        </LinkWrapper>
    )
}
