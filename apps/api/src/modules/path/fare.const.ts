import { CarrisLine } from 'src/common/types/carris.types'

export type FareCategoryId =
	| 'proximas'
	| 'longas'
	| 'rapidas'
	| 'inter-regionais'
	| 'mar'

export interface FareCategory {
	id: FareCategoryId
	label: string
	color: string
	onboardPrice: number
	prepaidPrice?: number
}

export const FARE_CATEGORIES: FareCategory[] = [
	{
		id: 'proximas',
		label: 'Linhas Próximas',
		color: '#3D85C6',
		onboardPrice: 1.3,
		prepaidPrice: 0.85,
	},
	{
		id: 'longas',
		label: 'Linhas Longas',
		color: '#C61D23',
		onboardPrice: 2.7,
		prepaidPrice: 1.55,
	},
	{
		id: 'rapidas',
		label: 'Linhas Rápidas',
		color: '#FDB71A',
		onboardPrice: 4.65,
		prepaidPrice: 3.1,
	},
	{
		id: 'inter-regionais',
		label: 'Linhas Inter-Regionais',
		color: '#BB3E96',
		onboardPrice: 3.2,
	},
	{
		id: 'mar',
		label: 'Linhas Mar',
		color: '#0C807E',
		onboardPrice: 4.65,
		prepaidPrice: 3.1,
	},
]

const INTER_REGIONAIS_49_PRICE = 3.7

export function getFareCategoryByColor(line: CarrisLine): FareCategory | null {
	const category = FARE_CATEGORIES.find(
		(candidate) => candidate.color.toLowerCase() === line.color.toLowerCase(),
	)
	return category ?? null
}

export function getEstimatedFare(line: CarrisLine): number | null {
	const category = getFareCategoryByColor(line)
	if (!category) return null

	if (category.id === 'inter-regionais' && line.short_name.startsWith('49')) {
		return INTER_REGIONAIS_49_PRICE
	}

	return category.onboardPrice
}
