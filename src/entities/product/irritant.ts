export const IRRITANT_INGREDIENT_MAX_LENGTH = 120
export const IRRITANT_REASON_MAX_LENGTH = 400
export const PRODUCT_COMPOSITION_MAX_LENGTH = 120
export const PRODUCT_COMPOSITION_MAX_ITEMS = 50

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

export function parseProductComposition(input: string):
	| { valid: true; value: string[] }
	| { valid: false; reason: 'too-long' | 'too-many' } {
	const value = input
		.split(/[,;\n]/)
		.map((item) => item.trim())
		.filter(Boolean)

	if (value.length > PRODUCT_COMPOSITION_MAX_ITEMS) {
		return { valid: false, reason: 'too-many' }
	}
	if (value.some((item) => item.length > PRODUCT_COMPOSITION_MAX_LENGTH)) {
		return { valid: false, reason: 'too-long' }
	}

	return { valid: true, value: [...new Set(value)] }
}

function normalizeComponent(value: string) {
	return value
		.normalize('NFKC')
		.toLocaleLowerCase('uk-UA')
		.replace(/[()]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
}

function containsNormalizedPhrase(text: string, phrase: string) {
	return ` ${text} `.includes(` ${phrase} `)
}

export function findMatchingIrritantComponents(
	composition: readonly string[] | null | undefined,
	irritantIngredient: string | null | undefined,
) {
	if (!composition?.length || !irritantIngredient) return []

	const irritantTerms = irritantIngredient
		.split(/[,;+\n]|(?<![\p{L}\p{N}_])(?:and|та|або)(?![\p{L}\p{N}_])/iu)
		.map(normalizeComponent)
		.filter(Boolean)

	return composition.filter((component) => {
		const normalizedComponent = normalizeComponent(component)
		return irritantTerms.some((term) =>
			containsNormalizedPhrase(normalizedComponent, term)
			|| containsNormalizedPhrase(term, normalizedComponent),
		)
	})
}
