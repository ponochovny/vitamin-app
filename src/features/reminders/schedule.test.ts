import { describe, expect, it } from 'vitest'
import {
	DEFAULT_REMINDER_TIMES,
	isValidReminderTimes,
	normalizeReminderTime,
} from './schedule'

describe('meal reminder schedule', () => {
	it('uses the standard morning, day, and evening times', () => {
		expect(DEFAULT_REMINDER_TIMES).toEqual({
			morning: '09:00',
			day: '14:00',
			evening: '18:00',
		})
		expect(isValidReminderTimes(DEFAULT_REMINDER_TIMES)).toBe(true)
	})

	it('keeps each reminder inside its matching part of the day', () => {
		expect(isValidReminderTimes({
			morning: '11:59',
			day: '12:00',
			evening: '23:59',
		})).toBe(true)
		expect(isValidReminderTimes({
			morning: '12:00',
			day: '11:59',
			evening: '18:00',
		})).toBe(false)
	})

	it('normalizes database time values for time inputs', () => {
		expect(normalizeReminderTime('09:00:00')).toBe('09:00')
	})
})
