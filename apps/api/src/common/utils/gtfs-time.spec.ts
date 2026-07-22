import { formatGtfsTimeAsClock } from './gtfs-time'

describe('formatGtfsTimeAsClock', () => {
	it('keeps times within a normal day unchanged', () => {
		expect(formatGtfsTimeAsClock('09:05:00')).toBe('09:05')
	})

	it('wraps GTFS after-midnight hours back to the 00-23 range', () => {
		expect(formatGtfsTimeAsClock('24:25:00')).toBe('00:25')
	})

	it('wraps hours further past midnight', () => {
		expect(formatGtfsTimeAsClock('25:05:00')).toBe('01:05')
	})
})
