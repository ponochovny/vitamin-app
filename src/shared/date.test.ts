import { describe, expect, it } from 'vitest'
import { formatLocalHour, formatLocalTime, getLocalDate } from './date'

describe('getLocalDate', () => {
	it('uses the user timezone instead of UTC', () => {
		const date = new Date('2026-11-19T22:30:00.000Z')
		expect(getLocalDate(date, 'Europe/Kyiv')).toBe('2026-11-20')
	})

	it('does not cross a date boundary for same-day UTC noon', () => {
		const date = new Date('2026-11-20T12:00:00.000Z')
		expect(getLocalDate(date, 'Europe/Kyiv')).toBe('2026-11-20')
	})
})

describe('formatLocalHour', () => {
	it('formats an entry time as a local hour with an AM/PM marker', () => {
		expect(formatLocalHour('2026-11-20T09:00:00.000Z', 'Europe/Kyiv')).toBe('11AM')
		expect(formatLocalHour('2026-11-20T14:00:00.000Z', 'Europe/Kyiv')).toBe('4PM')
	})
})

describe('formatLocalTime', () => {
	it('formats entry time in the selected timezone using a 24-hour clock', () => {
		expect(formatLocalTime('2026-11-20T09:35:00.000Z', 'Europe/Kyiv')).toBe('11:35')
		expect(formatLocalTime('2026-11-20T23:05:00.000Z', 'Europe/Kyiv')).toBe('01:05')
	})
})
