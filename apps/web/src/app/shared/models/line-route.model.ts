export interface LineRouteStop {
	stopId: string
	name: string
	sequence: number
	lat: number
	lon: number
	minutesUntilArrival: number | null
	scheduledArrival: string | null
}

export interface LineDirection {
	directionId: number
	headsign: string
}

export interface LineRoute {
	id: string
	shortName: string
	longName: string
	color: string
	textColor: string
	directionId: number
	headsign: string
	directions: LineDirection[]
	stops: LineRouteStop[]
}
