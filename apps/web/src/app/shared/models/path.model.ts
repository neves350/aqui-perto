export class PathLeg {
	lineId!: string
	lineName!: string
	originStopId!: string
	destinationStopId!: string
	departureTime!: string
	arrivalTime!: string
}

export class PathOption {
	legs!: PathLeg[]
	totalTimeMinutes!: number
	estimatedFare?: number
}

export type PathNotFoundReason = 'no-path-found'

export class PathResult {
	found!: boolean
	reason?: PathNotFoundReason
	results?: PathOption[]
}

export class PathQuery {
	originStopId!: string
	destinationStopId!: string
	departureTime?: string
}
