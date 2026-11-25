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

		it('matches whole words and contiguous phrases, not substrings', () => {
			expect(
				findMatchingIrritantComponents(
					['Порошок сухе молоко'],
					'сухе молоко',
				),
			).toEqual(['Порошок сухе молоко'])
			expect(findMatchingIrritantComponents(['молоко'], 'Сухе молоко')).toEqual([
				'молоко',
			])
			expect(findMatchingIrritantComponents(['Барбарис'], 'рис')).toEqual([])
		})

		it('splits Ukrainian conjunctions without treating them as ingredients', () => {
			expect(findMatchingIrritantComponents(['та'], 'молоко та овес')).toEqual([])
			expect(findMatchingIrritantComponents(['або'], 'молоко або овес')).toEqual([])
		})

		it('preserves comma and English and splitting', () => {
			expect(
				findMatchingIrritantComponents(
					['milk', 'oats', 'and'],
					'milk and oats',
				),
			).toEqual(['milk', 'oats'])
			expect(
				findMatchingIrritantComponents(['milk', 'oats'], 'milk, oats'),
			).toEqual(['milk', 'oats'])
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
