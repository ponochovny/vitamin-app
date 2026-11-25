import { describe, expect, it } from 'vitest'
import {
	IRRITANT_INGREDIENT_MAX_LENGTH,
	IRRITANT_REASON_MAX_LENGTH,
	PRODUCT_COMPOSITION_MAX_LENGTH,
	findMatchingIrritantComponents,
	parseProductComposition,
	parseProductIrritant,
} from './irritant'

describe('parseProductIrritant', () => {
	it('returns null when both fields are empty', () => {
		expect(parseProductIrritant('  ', '')).toEqual({ valid: true, value: null })
	})

	describe('product composition', () => {
		it('parses a comma-separated composition and removes duplicates', () => {
			expect(parseProductComposition(' молоко, вода,\nмолоко ')).toEqual({
				valid: true,
				value: ['молоко', 'вода'],
			})
		})

		it('rejects components that are too long', () => {
			expect(
				parseProductComposition('а'.repeat(PRODUCT_COMPOSITION_MAX_LENGTH + 1)),
			).toEqual({ valid: false, reason: 'too-long' })
		})

		it('lists composition components that match a personal irritant', () => {
			expect(
				findMatchingIrritantComponents(
					['Овес', 'Сухе молоко', 'Сіль'],
					'молоко',
				),
			).toEqual(['Сухе молоко'])
		})
	})

	it('trims and returns a complete annotation', () => {
		expect(parseProductIrritant(' молоко ', ' Викликає дискомфорт ')).toEqual({
			valid: true,
			value: { ingredient: 'молоко', reason: 'Викликає дискомфорт' },
		})
	})

	it('rejects annotations with only one field', () => {
		expect(parseProductIrritant('молоко', '')).toEqual({
			valid: false,
			reason: 'incomplete',
		})
	})

	it('rejects values exceeding their field limits', () => {
		expect(
			parseProductIrritant(
				'a'.repeat(IRRITANT_INGREDIENT_MAX_LENGTH + 1),
				'Причина',
			),
		).toEqual({ valid: false, reason: 'too-long' })
		expect(
			parseProductIrritant(
				'Інгредієнт',
				'a'.repeat(IRRITANT_REASON_MAX_LENGTH + 1),
			),
		).toEqual({ valid: false, reason: 'too-long' })
	})
})
