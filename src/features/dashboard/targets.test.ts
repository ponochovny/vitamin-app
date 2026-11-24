import { describe, expect, it } from 'vitest'
import {
	getProgressPercent,
	scaleNutrition,
	summarizeFoodNutrition,
} from './targets'

describe('dashboard target calculations', () => {
	it('clamps progress to the visible dial range', () => {
		expect(getProgressPercent(500, 1000)).toBe(50)
		expect(getProgressPercent(1200, 1000)).toBe(100)
		expect(getProgressPercent(10, 0)).toBe(0)
	})

	it('scales nutrition values from the product reference amount', () => {
		expect(scaleNutrition(
			{ calories: 100, proteins: 5, fats: 2, carbs: 10 },
			150,
			100
		)).toEqual({ calories: 150, proteins: 7.5, fats: 3, carbs: 15 })
	})

	it('scales proportionally when the reference quantity is 1', () => {
		const nutrition = { calories: 100, proteins: 5, fats: 2, carbs: 10 }

		expect(scaleNutrition(nutrition, 2, 1)).toEqual({
			calories: 200,
			proteins: 10,
			fats: 4,
			carbs: 20,
		})
		expect(scaleNutrition(nutrition, 0.5, 1)).toEqual({
			calories: 50,
			proteins: 2.5,
			fats: 1,
			carbs: 5,
		})
	})

	it('does not scale with missing or invalid reference values', () => {
		const nutrition = { calories: 100, proteins: 5, fats: 2, carbs: 10 }

		expect(scaleNutrition(nutrition, 1, 0)).toEqual({
			calories: 0,
			proteins: 0,
			fats: 0,
			carbs: 0,
		})
	})

	it('shows known nutrition as a partial total when another food is unknown', () => {
		expect(
			summarizeFoodNutrition([
				{
					calories: 240,
					proteins: 8,
					fats: 4,
					carbs: 36,
					products: { chars: { nutritionKnown: true } },
				},
				{
					calories: 60,
					proteins: 1,
					fats: 1,
					carbs: 3,
					products: { chars: { nutritionKnown: false } },
				},
			]),
		).toEqual({
			calories: 300,
			proteins: 9,
			fats: 5,
			carbs: 39,
			nutritionUnknown: true,
		})
	})
})
