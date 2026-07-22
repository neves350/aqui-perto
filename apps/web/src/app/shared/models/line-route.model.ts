export interface LineRouteStop {
	stopId: string
	name: string
	sequence: number
	lat: number
	lon: number
	minutesUntilArrival: number | null
	scheduledArrival: string | null
}

export interface LineRoute {
	id: string
	shortName: string
	longName: string
	color: string
	textColor: string
	stops: LineRouteStop[]
}
