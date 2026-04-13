import { Tooltip } from "@mui/material"
import { Link } from 'react-router-dom'
import type {EventLocationType} from './EventCard'

export default function EventLocation({location}:{location:EventLocationType}) {

    return (
        <Tooltip title="View on Google Maps" placement='bottom-start'>
            <Link
                className="address"
                // to={`/campus-map?location=${location?.location_key}`}
                to={location?.map_url}
                target="_blank"
                aria-label="View on campus map"
            >
                <p className='body-large'>
                    {location?.venue}
                    {location?.building ? <><br/>{location?.building}</> : ''}
                </p>
            </Link>
        </Tooltip>
    )
}
