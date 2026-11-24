import { describe, expect, it } from 'vitest'
import { parseDecimalInput } from './numbers'

describe('parseDecimalInput', () => {
	it('accepts comma and dot as decimal separators', () => {
		expect(parseDecimalInput('6,7')).toBe(6.7)
		expect(parseDecimalInput('6.7')).toBe(6.7)
	})

	it('accepts decimal values without a leading zero', () => {
		expect(parseDecimalInput(',7')).toBe(0.7)
	})

	it('rejects empty, mixed-separator, and negative input', () => {
		expect(Number.isNaN(parseDecimalInput(''))).toBe(true)
		expect(Number.isNaN(parseDecimalInput('6,7.2'))).toBe(true)
		expect(Number.isNaN(parseDecimalInput('-6,7'))).toBe(true)
	})
})
