import { CarrisLine, CarrisPattern } from 'src/common/types/carris.types'

export interface TripMatch {
	departure: Date
	arrival: Date
}

export interface LegCandidate {
	line: CarrisLine
	originStopId: string
	destinationStopId: string
	trip: TripMatch
}

export interface PathCandidate {
	legs: LegCandidate[]
	totalMinutes: number
}

export interface LinePatterns {
	line: CarrisLine
	patterns: CarrisPattern[]
}

// Lookups shared by every round of the search.
export interface SearchContext {
	linePatternsById: Map<string, LinePatterns>
	stopsToLineIds: Map<string, Set<string>>
	destinationStopId: string
	dateStr: string
}

// A 2-leg journey (origin -> ... -> transfer stop) used as the seed for a 3rd leg.
export interface TwoLegSeed {
	legA: LegCandidate
	legB: LegCandidate
}
