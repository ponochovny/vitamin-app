import { describe, expect, it } from 'vitest'
import { nutritionSuggestionRequestSchema } from './nutritionSuggestionRequest'

describe('nutritionSuggestionRequestSchema', () => {
	it('rejects null and invalid request bodies', () => {
		expect(nutritionSuggestionRequestSchema.safeParse(null).success).toBe(false)
		expect(nutritionSuggestionRequestSchema.safeParse({
			name: 'Картошка',
			quantity: 1,
			unit: 'piece',
			composition: [1],
		}).success).toBe(false)
	})

	it('trims names and preserves numeric quantity coercion', () => {
		expect(nutritionSuggestionRequestSchema.parse({
			name: '  Картошка  ',
			quantity: '1.5',
			unit: 'piece',
			composition: [],
		})).toEqual({
			name: 'Картошка',
			quantity: 1.5,
			unit: 'piece',
			composition: [],
		})
	})
})
