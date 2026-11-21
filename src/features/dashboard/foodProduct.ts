export interface FoodNutrition {
	calories: number
	proteins: number
	fats: number
	carbs: number
}

export interface FoodProductInfo {
	name: string
	quantity: number
	chars: FoodNutrition & {
		unit?: 'g' | 'ml' | 'piece'
		nutritionKnown?: boolean
	}
}

export interface LoggedFoodInfo {
	quantity: number
	nutrition: FoodNutrition
}
