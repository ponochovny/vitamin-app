import { describe, expect, it } from 'vitest'
import { getProgressPercent, scaleNutrition } from './targets'

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
})
