export interface FoodNutrition {
	calories: number
	proteins: number
	fats: number
	carbs: number
}

export interface FoodProductInfo {
	id: string
	name: string
	quantity: number
	chars: FoodNutrition & {
		vitamins?: Record<string, number>
		unit?: 'g' | 'ml' | 'piece'
		nutritionKnown?: boolean
	}
}

export interface LoggedFoodInfo {
	quantity: number
	nutrition: FoodNutrition
}

export function parseNutritionInput(value: string): number {
	const normalized = value.trim().replace(',', '.')
	if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return Number.NaN
	return Number(normalized)
}
