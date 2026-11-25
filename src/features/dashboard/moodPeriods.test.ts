import { describe, expect, it } from 'vitest'
import {
	DEFAULT_MOOD_PERIODS,
	normalizeMoodPeriodSettings,
} from './moodPeriods'

describe('normalizeMoodPeriodSettings', () => {
	it('returns defaults for missing profile settings', () => {
		expect(normalizeMoodPeriodSettings(null)).toEqual(DEFAULT_MOOD_PERIODS)
	})

	it('normalizes custom labels and anchors', () => {
		expect(normalizeMoodPeriodSettings({
			morning: { label: 'Після сна', question: 'Як прокинувся?', anchor: 'wake' },
		}).morning).toEqual({
			label: 'Після сна',
			question: 'Як прокинувся?',
			anchor: 'wake',
		})
	})

	it('falls back for invalid anchors', () => {
		const result = normalizeMoodPeriodSettings({
			evening: { label: 'Спокій', question: 'Як завершив день?', anchor: 'bad' as never },
		})
		expect(result.evening.anchor).toBe('sleep')
	})
})
