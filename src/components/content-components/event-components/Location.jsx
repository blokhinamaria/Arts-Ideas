import { Tooltip } from "@mui/material"

export default function Location({location}) {

    return (
        <Tooltip title="Open in Google Maps"  placement='bottom-start'>
            <a className="address" href={location?.map_url} target="_blank">
                <p className='body-large'>
                    {location?.venue}
                    {location?.building ? <><br/>{location?.building}</> : ''}
                </p>
            </a>
        </Tooltip>
    )
}