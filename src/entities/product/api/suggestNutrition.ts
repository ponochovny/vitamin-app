export interface NutritionSuggestionInput {
	name: string
	quantity: number
	unit: 'g' | 'ml' | 'piece'
	composition?: string[]
}

export interface NutritionSuggestion {
	calories: number
	proteins: number
	fats: number
	carbs: number
	confidence: 'low' | 'medium' | 'high'
}

export function requestNutritionSuggestion(input: NutritionSuggestionInput) {
	return $fetch<NutritionSuggestion>('/api/products/nutrition-suggestion', {
		method: 'POST',
		body: input,
	})
}

export function getNutritionSuggestionNotice(
	confidence: NutritionSuggestion['confidence'],
) {
	if (confidence === 'high') {
		return 'ШІ запропонував оцінку з високою впевненістю. Перевірте та за потреби змініть значення.'
	}
	if (confidence === 'medium') {
		return 'ШІ запропонував приблизну оцінку. Перевірте значення перед збереженням.'
	}
	return 'ШІ має низьку впевненість в оцінці. Перевірте її за етикеткою або введіть значення вручну.'
}
