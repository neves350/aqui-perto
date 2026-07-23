import { describe, expect, it } from 'vitest'
import {
	formatFare,
	legDurationMinutes,
	transferCount,
} from './path-formatting'

describe('formatFare', () => {
	it('formats a fare using a comma as the decimal separator', () => {
		expect(formatFare(1.3)).toBe('1,30')
	})

	it('returns null when no fare is given', () => {
		expect(formatFare(undefined)).toBeNull()
	})
})

describe('legDurationMinutes', () => {
	it('returns the minutes between departure and arrival', () => {
		expect(
			legDurationMinutes({ departureTime: '08:00', arrivalTime: '08:20' }),
		).toBe(20)
	})

	it('wraps around midnight when the arrival is on the next day', () => {
		expect(
			legDurationMinutes({ departureTime: '23:50', arrivalTime: '00:10' }),
		).toBe(20)
	})
})

describe('transferCount', () => {
	it('is 0 for a direct trip with a single leg', () => {
		expect(
			transferCount([{ departureTime: '08:00', arrivalTime: '08:20' }]),
		).toBe(0)
	})

	it('is 1 for a trip with one transfer', () => {
		expect(
			transferCount([
				{ departureTime: '08:00', arrivalTime: '08:15' },
				{ departureTime: '08:18', arrivalTime: '08:30' },
			]),
		).toBe(1)
	})
})
