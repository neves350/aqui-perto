export interface Arrival {
	tripId: string
	lineId: string
	lineName: string
	arrivalTime: string
	type: 'scheduled' | 'estimated'
}
