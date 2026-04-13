import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import './CampusMap.css'

import campusSvgRaw from '../../assets/map/campus-map.svg?raw'

type LocationData = {
    key: string
    venue: string
    building: string
    address: string
}

type LegendGroup = {
    key: string
    children?: string[]
}

// Maps database location_key → the id attribute on the SVG group element.
// Illustrator encodes underscores as _x5F_ and a trailing carriage return as _x0D_.
const LOCATION_KEY_TO_SVG_ID: Record<string, string> = {
    ferman:              'ferman',
    gordon_theater:      'gordon_x5F_theater',
    performance_gallery: 'performance_x5F_gallery',
    saunders_gallery:    'saunders_x5F_gallery_x0D_',
    black_box_theater:   'black_x5F_box_x5F_theater',
    bailey:              'bailey',
    design_studios:      'design_x5F_studios',
    scarfone_gallery:    'scarfone_x5F_gallery',
    sykes_plaza:         'sykes_x5F_plaza',
    sykes_chapel:        'sykes_x5F_chapel',
    vaughn:              'vaughn',
    reeves_theater:      'reeves_x5F_theater',
    crescent_club:       'crescent_x5F_club',
    falk_theatre:        'falk_x5F_theatre',
    plant_hall:          'plant_x5F_hall',
    fletcher_lounge:     'fletcher_x5F_lounge',
    music_room:          'music_x5F_room',
    grand_salon:         'grand_x5F_salon',
    parking:             'parking',
}

const LEGEND_GROUPS: LegendGroup[] = [
    {
        key: 'ferman',
        children: ['gordon_theater', 'performance_gallery', 'saunders_gallery', 'black_box_theater'],
    },
    { key: 'bailey', children: ['scarfone_gallery', 'design_studios'] },
    { key: 'vaughn', children: ['crescent_club', 'reeves_theater'] },
    { key: 'plant_hall', children: ['grand_salon', 'music_room', 'fletcher_lounge'] },
    { key: 'sykes_plaza' },
    { key: 'sykes_chapel' },
    { key: 'falk_theatre' },
    { key: 'parking' },
]

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export default function CampusMap() {
    const [searchParams, setSearchParams] = useSearchParams()
    const locationKey = searchParams.get('location')

    const svgRef = useRef<HTMLDivElement>(null)
    const transformRef = useRef<ReactZoomPanPinchRef>(null)
    const [locations, setLocations] = useState<LocationData[]>([])

    const activeLocation = locations.find(l => l.key === locationKey) ?? null

    const getVenueName = (key: string) =>
        locations.find(l => l.key === key)?.venue ?? key.replace(/_/g, ' ')

    useEffect(() => {
        fetch(`${API_BASE}/api/locations`)
            .then(r => r.json())
            .then((data: LocationData[]) => setLocations(data))
            .catch(err => console.error('Failed to fetch locations:', err))
    }, [])

    // Highlight the matching SVG element and zoom the map to it.
    useEffect(() => {
        if (!svgRef.current) return

        svgRef.current
            .querySelectorAll('.map-highlight')
            .forEach(el => el.classList.remove('map-highlight'))

        if (!locationKey) return

        const svgId = LOCATION_KEY_TO_SVG_ID[locationKey]
        if (!svgId) return

        const target = svgRef.current.querySelector<HTMLElement>(`#${svgId}`)
        if (target) {
            target.classList.add('map-highlight')
            // Zoom to the highlighted element — scale 2.5 gives a good close-up
            transformRef.current?.zoomToElement(target, 2.5, 400)
        }
    }, [locationKey])

    // Attach click listeners and pointer cursor to every interactive SVG element.
    useEffect(() => {
        if (!svgRef.current) return

        const listeners: Array<{ el: Element; handler: () => void }> = []

        for (const [key, svgId] of Object.entries(LOCATION_KEY_TO_SVG_ID)) {
            const el = svgRef.current.querySelector(`#${svgId}`)
            if (!el) continue
            el.classList.add('map-interactive')
            const handler = () => setSearchParams({ location: key })
            el.addEventListener('click', handler)
            listeners.push({ el, handler })
        }

        return () => {
            listeners.forEach(({ el, handler }) => el.removeEventListener('click', handler))
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const handleLegendClick = useCallback(
        (key: string) => setSearchParams({ location: key }),
        [setSearchParams]
    )

    return (
        <div className="campus-map-page">
            <div className="campus-map-viewport">
                <TransformWrapper
                    ref={transformRef}
                    initialScale={1}
                    minScale={0.3}
                    maxScale={6}
                    centerOnInit
                    limitToBounds={false}
                    doubleClick={{ disabled: false, step: 0.7 }}
                >
                    <TransformComponent
                        wrapperStyle={{ width: '100%', height: '100%' }}
                        contentStyle={{ width: '100%' }}
                    >
                        <div
                            ref={svgRef}
                            className="campus-map-svg-container"
                            dangerouslySetInnerHTML={{ __html: campusSvgRaw }}
                        />
                    </TransformComponent>
                </TransformWrapper>

                {/* Zoom controls */}
                <div className="campus-map-controls" aria-label="Map controls">
                    <button
                        className="campus-map-control-btn"
                        aria-label="Zoom in"
                        onClick={() => transformRef.current?.zoomIn(0.5)}
                    >
                        <span className="material-symbols-outlined">add</span>
                    </button>
                    <button
                        className="campus-map-control-btn"
                        aria-label="Zoom out"
                        onClick={() => transformRef.current?.zoomOut(0.5)}
                    >
                        <span className="material-symbols-outlined">remove</span>
                    </button>
                    <button
                        className="campus-map-control-btn"
                        aria-label="Reset view"
                        onClick={() => transformRef.current?.resetTransform()}
                    >
                        <span className="material-symbols-outlined">fit_page</span>
                    </button>
                </div>
            </div>

            <aside className="campus-map-legend">
                <h5 className="secondary-title campus-map-legend-title">Map Key</h5>

                <ul className="campus-map-legend-list">
                    {LEGEND_GROUPS.map(group => (
                        <li key={group.key} className="campus-map-legend-group">
                            <button
                                className={`campus-map-legend-item${locationKey === group.key ? ' active' : ''}`}
                                onClick={() => handleLegendClick(group.key)}
                            >
                                <span className="campus-map-legend-dot" aria-hidden="true" />
                                {getVenueName(group.key)}
                            </button>

                            {group.children && (
                                <ul className="campus-map-legend-children">
                                    {group.children.map(childKey => (
                                        <li key={childKey}>
                                            <button
                                                className={`campus-map-legend-item campus-map-legend-child${locationKey === childKey ? ' active' : ''}`}
                                                onClick={() => handleLegendClick(childKey)}
                                            >
                                                {getVenueName(childKey)}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>

                {activeLocation && (
                    <div className="campus-map-info">
                        <hr />
                        <p className="body-large"><strong>{activeLocation.venue}</strong></p>
                        {activeLocation.building && (
                            <p className="body-large">{activeLocation.building}</p>
                        )}
                        <p className="body-large">{activeLocation.address}</p>
                    </div>
                )}
            </aside>
        </div>
    )
}
