import { describe, expect, it } from 'vitest'
import {
	filterProducts,
	getApproximatePortionQuantities,
	getFoodSuggestions,
	getRecentFoods,
	matchesFoodProductDraft,
	parseOptionalNutrition,
} from './diary'

describe('diary helpers', () => {
	it('filters products by a trimmed, case-insensitive Ukrainian query', () => {
		const products = [{ name: 'Яблуко' }, { name: 'Банан' }]

		expect(filterProducts(products, '  ЯБЛ  ')).toEqual([{ name: 'Яблуко' }])
		expect(filterProducts(products, 'груша')).toEqual([])
	})

	it('keeps the latest entry per product and ignores invalid recent quantities', () => {
		expect(getRecentFoods([
			{ productId: 'apple', quantity: 150 },
			{ productId: 'apple', quantity: 100 },
			{ productId: null, quantity: 200 },
			{ productId: 'banana', quantity: 0 },
			{ productId: 'pear', quantity: 80 },
		])).toEqual([
			{ productId: 'apple', quantity: 150 },
			{ productId: 'pear', quantity: 80 },
		])
	})

	it('applies the product limit after deduplicating the full ordered input', () => {
		const entries = [
			...Array.from({ length: 31 }, () => ({
				productId: 'apple',
				quantity: 150,
			})),
			{ productId: 'banana', quantity: 100 },
			{ productId: 'pear', quantity: 80 },
			{ productId: 'plum', quantity: 60 },
			{ productId: 'orange', quantity: 40 },
			{ productId: 'grape', quantity: 20 },
		]

		expect(getRecentFoods(entries)).toEqual([
			{ productId: 'apple', quantity: 150 },
			{ productId: 'banana', quantity: 100 },
			{ productId: 'pear', quantity: 80 },
			{ productId: 'plum', quantity: 60 },
			{ productId: 'orange', quantity: 40 },
		])
	})

	it('offers approximate portions relative to the reference quantity or piece count', () => {
		expect(getApproximatePortionQuantities(100, 'g')).toEqual([50, 100, 150])
		expect(getApproximatePortionQuantities(250, 'ml')).toEqual([125, 250, 375])
		expect(getApproximatePortionQuantities(100, 'piece')).toEqual([1, 2])
		expect(getApproximatePortionQuantities(0, 'g')).toEqual([])
	})

	it('matches recovered products against their submitted draft', () => {
		const draft = {
			name: 'Рис',
			unit: 'g' as const,
			referenceQuantity: 100,
			nutrition: { calories: 130, proteins: 2.7, fats: 0.3, carbs: 28 },
		}
		const product = {
			name: 'Рис',
			quantity: 100,
			chars: { ...draft.nutrition, unit: 'g' as const, nutritionKnown: true },
		}

		expect(matchesFoodProductDraft(product, draft)).toBe(true)
		expect(matchesFoodProductDraft({
			...product,
			chars: { ...product.chars, carbs: 30 },
		}, draft)).toBe(false)
		expect(matchesFoodProductDraft({
			...product,
			quantity: 200,
		}, draft)).toBe(false)
		expect(matchesFoodProductDraft(product, {
			...draft,
			nutrition: null,
		})).toBe(false)
	})

	it('ranks known products by the remaining macros and ignores completed goals', () => {
		const suggestions = getFoodSuggestions([
			{
				id: 'rice',
				name: 'Рис',
				quantity: 100,
				chars: { calories: 130, proteins: 2.7, fats: 0.3, carbs: 28 },
			},
			{
				id: 'eggs',
				name: 'Яйця',
				quantity: 1,
				chars: { calories: 70, proteins: 6, fats: 5, carbs: 0.6 },
			},
			{
				id: 'unknown',
				name: 'Невідомий продукт',
				quantity: 100,
				chars: {
					calories: 0,
					proteins: 100,
					fats: 100,
					carbs: 100,
					nutritionKnown: false,
				},
			},
		], {
			proteins: 90,
			fats: 70,
			carbs: 200,
		}, {
			proteins: 100,
			fats: 70,
			carbs: 250,
		})

		expect(suggestions.map(({ product }) => product.id)).toEqual(['rice', 'eggs'])
		expect(suggestions[0].matches.map(({ key }) => key)).toEqual([
			'proteins',
			'carbs',
		])
	})

	it('returns no suggestions when every macro goal is reached', () => {
		expect(getFoodSuggestions([{
			id: 'rice',
			name: 'Рис',
			quantity: 100,
			chars: { calories: 130, proteins: 2.7, fats: 0.3, carbs: 28 },
		}], {
			proteins: 100,
			fats: 70,
			carbs: 250,
		}, {
			proteins: 100,
			fats: 70,
			carbs: 250,
		})).toEqual([])
	})

	it('accepts nutrition only when all values are provided or all are omitted', () => {
		expect(parseOptionalNutrition({
			calories: '',
			proteins: '',
			fats: '',
			carbs: '',
		})).toEqual({ valid: true, nutrition: null })
		expect(parseOptionalNutrition({
			calories: '210',
			proteins: '8,5',
			fats: '9.2',
			carbs: '24',
		})).toEqual({
			valid: true,
			nutrition: { calories: 210, proteins: 8.5, fats: 9.2, carbs: 24 },
		})
		expect(parseOptionalNutrition({
			calories: '210',
			proteins: '',
			fats: '9',
			carbs: '24',
		})).toEqual({ valid: false, reason: 'partial' })
	})
})
