import { parseDecimalInput } from '../../shared/numbers'

export interface RecentFoodEntry {
	productId: string | null
	quantity: number
}

export interface FoodNutrition {
	calories: number
	proteins: number
	fats: number
	carbs: number
}

export const FOOD_MACRO_KEYS = ['proteins', 'fats', 'carbs'] as const

export type FoodMacroKey = (typeof FOOD_MACRO_KEYS)[number]
export type FoodMacroValues = Pick<FoodNutrition, FoodMacroKey>

export interface FoodSuggestionProduct {
	id: string
	name: string
	quantity: number
	chars: FoodNutrition & {
		unit?: 'g' | 'ml' | 'piece'
		nutritionKnown?: boolean
	}
}

export interface FoodSuggestion {
	product: FoodSuggestionProduct
	matches: Array<{ key: FoodMacroKey; label: string; amount: number }>
}

export function getFoodSuggestions(
	products: readonly FoodSuggestionProduct[],
	consumed: FoodMacroValues,
	targets: FoodMacroValues,
	limit = 3,
): FoodSuggestion[] {
	const remaining = FOOD_MACRO_KEYS.flatMap((key) => {
		const target = Number(targets[key])
		const current = Number(consumed[key])
		const amount = target - current
		if (!Number.isFinite(target) || !Number.isFinite(current) || amount <= 0) return []
		return [{
			key,
			amount,
			label: { proteins: 'Білки', fats: 'Жири', carbs: 'Вуглеводи' }[key],
		}]
	})
	if (!remaining.length || !Number.isFinite(limit) || limit <= 0) return []

	const ranked = products.flatMap((product) => {
		if (
			product.chars.nutritionKnown === false
			|| !Number.isFinite(product.quantity)
			|| product.quantity <= 0
		) {
			return []
		}

		const matches = remaining.flatMap(({ key, amount, label }) => {
			const macroAmount = Number(product.chars[key])
			return Number.isFinite(macroAmount) && macroAmount > 0
				? [{ key, amount: macroAmount, label, score: Math.min(macroAmount / amount, 1) }]
				: []
		})
		if (!matches.length) return []

		return [{
			suggestion: {
				product,
				matches: matches.map(({ key, amount, label }) => ({ key, amount, label })),
			},
			score: matches.reduce((total, match) => total + match.score, 0),
		}]
	})

	return ranked
		.sort((a, b) =>
			b.score - a.score
			|| a.suggestion.product.name.localeCompare(b.suggestion.product.name, 'uk-UA')
		)
		.slice(0, Math.floor(limit))
		.map(({ suggestion }) => suggestion)
}

export function getApproximatePortionQuantities(
	referenceQuantity: number,
	unit: 'g' | 'ml' | 'piece',
): number[] {
	if (unit === 'piece') return [1, 2]
	if (!Number.isFinite(referenceQuantity) || referenceQuantity <= 0) return []
	return [0.5, 1, 1.5].map((factor) => referenceQuantity * factor)
}

export type OptionalNutritionResult =
	| { valid: true; nutrition: FoodNutrition | null }
	| { valid: false; reason: 'partial' | 'invalid' }

export function parseOptionalNutrition(
	values: Record<keyof FoodNutrition, string | number>,
): OptionalNutritionResult {
	const entries = Object.values(values)
	if (entries.every((value) => value === '')) {
		return { valid: true, nutrition: null }
	}
	if (entries.some((value) => value === '')) {
		return { valid: false, reason: 'partial' }
	}

	const nutrition = Object.fromEntries(
		Object.entries(values).map(([key, value]) => [
			key,
			parseDecimalInput(String(value)),
		]),
	) as FoodNutrition
	if (Object.values(nutrition).some((value) => !Number.isFinite(value) || value < 0)) {
		return { valid: false, reason: 'invalid' }
	}
	return { valid: true, nutrition }
}

export function getRecentFoods(
	entries: readonly RecentFoodEntry[],
	limit = 5,
): RecentFoodEntry[] {
	const seen = new Set<string>()
	return entries.flatMap((entry) => {
		if (
			!entry.productId
			|| seen.has(entry.productId)
			|| !Number.isFinite(entry.quantity)
			|| entry.quantity <= 0
		) {
			return []
		}
		seen.add(entry.productId)
		return [entry]
	}).slice(0, Math.max(0, limit))
}

export function filterProducts<T extends { name: string }>(
	products: readonly T[],
	query: string,
): T[] {
	const normalizedQuery = query.trim().toLocaleLowerCase('uk-UA')
	if (!normalizedQuery) return [...products]
	return products.filter((product) =>
		product.name.toLocaleLowerCase('uk-UA').includes(normalizedQuery)
	)
}
