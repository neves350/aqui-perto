export class PathLegDto {
	lineId!: string
	lineName!: string
	originStopId!: string
	destinationStopId!: string
	departureTime!: string
	arrivalTime!: string
}

export type PathNotFoundReason = 'no-0-1-transfer-combination'

export class PathResultDto {
	found!: boolean
	reason?: PathNotFoundReason
	legs?: PathLegDto[]
	totalTimeMinutes?: number
	estimatedFare?: number
}
