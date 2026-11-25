export const IRRITANT_INGREDIENT_MAX_LENGTH = 120
export const IRRITANT_REASON_MAX_LENGTH = 400

export interface ProductIrritant {
	ingredient: string
	reason: string
}

export type ProductIrritantParseResult =
	| { valid: true; value: ProductIrritant | null }
	| { valid: false; reason: 'incomplete' | 'too-long' }

export function parseProductIrritant(
	ingredientInput: string,
	reasonInput: string,
): ProductIrritantParseResult {
	const ingredient = ingredientInput.trim()
	const reason = reasonInput.trim()

	if (!ingredient && !reason) return { valid: true, value: null }
	if (!ingredient || !reason) return { valid: false, reason: 'incomplete' }
	if (
		ingredient.length > IRRITANT_INGREDIENT_MAX_LENGTH
		|| reason.length > IRRITANT_REASON_MAX_LENGTH
	) {
		return { valid: false, reason: 'too-long' }
	}

	return { valid: true, value: { ingredient, reason } }
}
