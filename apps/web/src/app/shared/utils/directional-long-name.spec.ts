import { describe, expect, it } from 'vitest'
import { getDirectionalLongName } from './directional-long-name'

describe('getDirectionalLongName', () => {
	it('keeps the order when the headsign matches the second part', () => {
		expect(getDirectionalLongName('Alameda - Odivelas', 'Odivelas')).toBe(
			'Alameda - Odivelas',
		)
	})

	it('reverses the order when the headsign matches the first part', () => {
		expect(getDirectionalLongName('Alameda - Odivelas', 'Alameda')).toBe(
			'Odivelas - Alameda',
		)
	})

	it('leaves circular lines unchanged', () => {
		expect(
			getDirectionalLongName(
				'Reboleira (Estação) | Circular via Alfragide',
				'Reboleira (Estação)',
			),
		).toBe('Reboleira (Estação) | Circular via Alfragide')
	})

	it('leaves lines with a "via" segment unchanged', () => {
		expect(
			getDirectionalLongName(
				'Amadora (Hospital) Via Mina e Venteira | Circular',
				'Amadora (Hospital)',
			),
		).toBe('Amadora (Hospital) Via Mina e Venteira | Circular')
	})

	it('leaves the name unchanged when the headsign matches neither part', () => {
		expect(getDirectionalLongName('Alameda - Odivelas', 'Outro Destino')).toBe(
			'Alameda - Odivelas',
		)
	})

	it('leaves the name unchanged when there is more than one " - " separator', () => {
		expect(getDirectionalLongName('A - B - C', 'C')).toBe('A - B - C')
	})
})
