import { describe, expect, it } from 'vitest'
import { parseNutritionInput } from './foodProduct'

describe('parseNutritionInput', () => {
	it('accepts comma and dot as decimal separators', () => {
		expect(parseNutritionInput('6,7')).toBe(6.7)
		expect(parseNutritionInput('6.7')).toBe(6.7)
	})

	it('accepts decimal values without a leading zero', () => {
		expect(parseNutritionInput(',7')).toBe(0.7)
	})

	it('rejects empty, mixed-separator, and negative input', () => {
		expect(Number.isNaN(parseNutritionInput(''))).toBe(true)
		expect(Number.isNaN(parseNutritionInput('6,7.2'))).toBe(true)
		expect(Number.isNaN(parseNutritionInput('-6,7'))).toBe(true)
	})
})
