export interface CarrisStop {
	id: string
	long_name: string
	short_name: string | null
	lat: number
	lon: number
	line_ids: string[]
	route_ids: string[]
	pattern_ids: string[]
}

export interface CarrisLine {
	id: string
	short_name: string
	long_name: string
	color: string
	text_color: string
	route_ids: string[]
	pattern_ids: string[]
}

export interface CarrisPatternStop {
	stop_id: string
	stop_sequence: number
	distance: number
}

export interface CarrisPatternTripGroup {
	schedule: { stop_id: string; stop_sequence: number; arrival_time: string }[]
	trip_ids: string[]
	service_ids: string[]
	valid_on: string[] // "YYYYMMDD"
}

export interface CarrisPattern {
	id: string
	line_id: string
	route_id: string
	direction_id: number
	shape_id: string
	headsign: string
	path: CarrisPatternStop[]
	trips: CarrisPatternTripGroup[]
}

export interface CarrisArrival {
	line_id: string
	pattern_id: string
	route_id: string
	trip_id: string
	headsign: string
	stop_sequence: number
	scheduled_arrival: string | null // "HH:MM:SS"
	scheduled_arrival_unix: number | null
	estimated_arrival: string | null
	estimated_arrival_unix: number | null
	observed_arrival: string | null
	observed_arrival_unix: number | null
	vehicle_id: string | null
}

export interface CarrisShape {
	shape_id: string
	extension: number
	geojson: {
		type: 'Feature'
		properties: Record<string, unknown>
		geometry: {
			type: 'LineString'
			coordinates: [number, number][] // [lon, lat]
		}
	}
}
