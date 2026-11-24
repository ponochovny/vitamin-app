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
