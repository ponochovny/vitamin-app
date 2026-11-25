import { describe, expect, it } from 'vitest'
import {
	IRRITANT_INGREDIENT_MAX_LENGTH,
	IRRITANT_REASON_MAX_LENGTH,
	parseProductIrritant,
} from './irritant'

describe('parseProductIrritant', () => {
	it('returns null when both fields are empty', () => {
		expect(parseProductIrritant('  ', '')).toEqual({ valid: true, value: null })
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
