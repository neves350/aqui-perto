import { CarrisLine } from 'src/common/types/carris.types'
import {
	FARE_CATEGORIES,
	getEstimatedFare,
	getFareCategoryByColor,
} from './fare.const'

function buildLine(overrides: Partial<CarrisLine>): CarrisLine {
	return {
		id: 'line-1',
		short_name: '1001',
		long_name: 'Test Line',
		color: '#3D85C6',
		text_color: '#FFFFFF',
		route_ids: [],
		pattern_ids: [],
		...overrides,
	}
}

describe('fare.const', () => {
	describe('getFareCategoryByColor', () => {
		it('identifies "Linhas Próximas" by the blue color', () => {
			const line = buildLine({ color: '#3D85C6' })
			expect(getFareCategoryByColor(line)?.id).toBe('proximas')
		})

		it('identifies "Linhas Longas" by the red color', () => {
			const line = buildLine({ color: '#C61D23' })
			expect(getFareCategoryByColor(line)?.id).toBe('longas')
		})

		it('identifies "Linhas Rápidas" by the yellow color', () => {
			const line = buildLine({ color: '#FDB71A' })
			expect(getFareCategoryByColor(line)?.id).toBe('rapidas')
		})

		it('identifies "Linhas Inter-Regionais" by the pink color', () => {
			const line = buildLine({ color: '#BB3E96', short_name: '2905' })
			expect(getFareCategoryByColor(line)?.id).toBe('inter-regionais')
		})

		it('identifies "Linhas Mar" by the teal color', () => {
			const line = buildLine({ color: '#0C807E' })
			expect(getFareCategoryByColor(line)?.id).toBe('mar')
		})

		it('is case-insensitive when matching the color', () => {
			const line = buildLine({ color: '#3d85c6' })
			expect(getFareCategoryByColor(line)?.id).toBe('proximas')
		})

		it('returns null for a color with no known category', () => {
			const line = buildLine({ color: '#2A9057' })
			expect(getFareCategoryByColor(line)).toBeNull()
		})
	})

	describe('getEstimatedFare', () => {
		it('returns the onboard price for "Linhas Próximas"', () => {
			const line = buildLine({ color: '#3D85C6' })
			expect(getEstimatedFare(line)).toBe(1.3)
		})

		it('returns 3.20€ for Inter-Regionais with a 29 prefix', () => {
			const line = buildLine({ color: '#BB3E96', short_name: '2905' })
			expect(getEstimatedFare(line)).toBe(3.2)
		})

		it('returns 3.70€ for Inter-Regionais with a 49 prefix', () => {
			const line = buildLine({ color: '#BB3E96', short_name: '4905' })
			expect(getEstimatedFare(line)).toBe(3.7)
		})

		it('returns null when the line has no known fare category', () => {
			const line = buildLine({ color: '#2A9057', short_name: 'CP' })
			expect(getEstimatedFare(line)).toBeNull()
		})
	})

	describe('FARE_CATEGORIES', () => {
		it('contains the 5 categories documented in PATH.md', () => {
			expect(FARE_CATEGORIES.map((category) => category.id).sort()).toEqual(
				['inter-regionais', 'longas', 'mar', 'proximas', 'rapidas'].sort(),
			)
		})
	})
})
