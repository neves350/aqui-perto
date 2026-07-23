export class PathLegDto {
	lineId!: string
	lineName!: string
	originStopId!: string
	destinationStopId!: string
	departureTime!: string
	arrivalTime!: string
}

export class PathOptionDto {
	legs!: PathLegDto[]
	totalTimeMinutes!: number
	estimatedFare?: number
}

export type PathNotFoundReason = 'no-path-found'

export class PathResultDto {
	found!: boolean
	reason?: PathNotFoundReason
	results?: PathOptionDto[]
}
