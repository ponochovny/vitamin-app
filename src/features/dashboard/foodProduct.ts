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
	irritant_ingredient?: string | null
	irritant_reason?: string | null
}

export interface LoggedFoodInfo {
	quantity: number
	nutrition: FoodNutrition
}
