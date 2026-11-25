import type { ProductIrritant } from '~/src/entities/product/irritant'

export type DrinkKind = 'water' | 'coffee' | 'tea' | 'other'
export type MarkableDrinkKind = Exclude<DrinkKind, 'water'>

export interface DrinkTypeDetails {
	kind: MarkableDrinkKind
	name: string
	irritant_ingredient: string | null
	irritant_reason: string | null
}

export interface DrinkTypeProfile extends DrinkTypeDetails {
	id: string
}

export function isMarkableDrinkKind(value: string): value is MarkableDrinkKind {
	return value === 'coffee' || value === 'tea' || value === 'other'
}

export interface DrinkLogSubmission {
	kind: DrinkKind
	volumeMl: number
	drinkTypeId: string | null
	name: string | null
	irritant: ProductIrritant | null
}

export function normalizeDrinkTypeName(value: string) {
	const name = value.trim()
	return {
		name,
		nameKey: name.toLocaleLowerCase('uk-UA'),
	}
}
