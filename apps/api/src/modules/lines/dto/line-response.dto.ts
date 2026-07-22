export class LineResponseDto {
	id!: string
	shortName!: string
	longName!: string
	color!: string
	textColor!: string
}

export class LinePatternScheduleStopDto {
	stopId!: string
	sequence!: number
	arrivalTime!: string
}

export class LinePatternTripDto {
	tripIds!: string[]
	schedule!: LinePatternScheduleStopDto[]
}

export class LinePatternPathStopDto {
	stopId!: string
	sequence!: number
}

export class LinePatternDto {
	id!: string
	headsign!: string
	directionId!: number
	path!: LinePatternPathStopDto[]
	trips!: LinePatternTripDto[]
}

export class LineDetailResponseDto extends LineResponseDto {
	patterns!: LinePatternDto[]
}

export class LineRouteStopDto {
	stopId!: string
	name!: string
	sequence!: number
	lat!: number
	lon!: number
	minutesUntilArrival!: number | null
	scheduledArrival!: string | null
}

export class LineRouteResponseDto extends LineResponseDto {
	stops!: LineRouteStopDto[]
}
