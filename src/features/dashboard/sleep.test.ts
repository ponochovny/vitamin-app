import { describe, expect, it } from 'vitest'
import {
	calculateSleepDurationMinutes,
	formatSleepDuration,
	normalizeSleepEntryValue,
} from './sleep'

describe('sleep helpers', () => {
	it('calculates sleep across midnight', () => {
		expect(calculateSleepDurationMinutes('23:30', '07:15')).toBe(465)
	})

	it('normalizes valid saved values and rejects invalid quality', () => {
		expect(normalizeSleepEntryValue({
			quality: 4,
			label: 'ignored',
			bedtime: '23:00',
			wakeTime: '07:30',
		}).quality).toBe(4)
		expect(normalizeSleepEntryValue({
			quality: 9,
			bedtime: '23:00',
			wakeTime: '07:30',
		})).toBeNull()
	})

	it('formats duration', () => {
		expect(formatSleepDuration(480)).toBe('8 г')
		expect(formatSleepDuration(465)).toBe('7 г 45 хв')
	})
})
