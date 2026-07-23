export class PathLeg {
	lineId!: string
	lineName!: string
	originStopId!: string
	destinationStopId!: string
	departureTime!: string
	arrivalTime!: string
}

export type PathNotFoundReason = 'no-0-1-transfer-combination'

export class PathResult {
	found!: boolean
	reason?: PathNotFoundReason
	legs?: PathLeg[]
	totalTimeMinutes?: number
	estimatedFare?: number
}

export class PathQuery {
	originStopId!: string
	destinationStopId!: string
	departureTime?: string
}
