export interface Stop {
	id: string
	name: string
	lat: number
	lon: number
	distanceMeters?: number
}

export interface Line {
	id: string
	shortName: string
	longName: string
	color: string
	textColor: string
}

export interface LinePatternScheduleStop {
	stopId: string
	sequence: number
	arrivalTime: string
}

export interface LinePatternTrip {
	tripIds: string[]
	schedule: LinePatternScheduleStop[]
}

export interface LinePatternPathStop {
	stopId: string
	sequence: number
}

export interface LinePattern {
	id: string
	headsign: string
	directionId: number
	path: LinePatternPathStop[]
	trips: LinePatternTrip[]
}

export interface LineDetail extends Line {
	patterns: LinePattern[]
}

export interface Arrival {
	tripId: string
	lineId: string
	lineName: string
	arrivalTime: string
	type: 'scheduled'
}
