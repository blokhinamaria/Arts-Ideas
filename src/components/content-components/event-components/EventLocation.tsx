import { Tooltip } from "@mui/material"
import type {EventLocationType} from './EventCard'

export default function EventLocation({location}:{location:EventLocationType}) {

    return (
        <Tooltip title="Open in Google Maps (opens in a new tab)"  placement='bottom-start'>
            <a
                className="address"
                href={location?.map_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open in Google Maps (opens in a new tab)"
            >
                <p className='body-large'>
                    {location?.venue}
                    {location?.building ? <><br/>{location?.building}</> : ''}
                </p>
            </a>
        </Tooltip>
    )
}
