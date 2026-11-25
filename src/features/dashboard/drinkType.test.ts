import { describe, expect, it } from 'vitest'
import { isMarkableDrinkKind } from './drinkType'

describe('isMarkableDrinkKind', () => {
	it('allows non-water drink categories', () => {
		expect(isMarkableDrinkKind('coffee')).toBe(true)
		expect(isMarkableDrinkKind('tea')).toBe(true)
		expect(isMarkableDrinkKind('other')).toBe(true)
	})

	it('does not allow water or unknown categories', () => {
		expect(isMarkableDrinkKind('water')).toBe(false)
		expect(isMarkableDrinkKind('juice')).toBe(false)
	})
})
