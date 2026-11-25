export type MoodPeriodKey = 'morning' | 'day' | 'evening'
export type MoodPeriodAnchor = 'wake' | 'midday' | 'sleep'

export interface MoodPeriodSetting {
	label: string
	question: string
	anchor: MoodPeriodAnchor
}

export type MoodPeriodSettings = Record<MoodPeriodKey, MoodPeriodSetting>

export const DEFAULT_MOOD_PERIODS: MoodPeriodSettings = {
	morning: { label: 'Ранок', question: 'Як прокинувся?', anchor: 'wake' },
	day: { label: 'День', question: 'Як минає день?', anchor: 'midday' },
	evening: { label: 'Вечір', question: 'Як пройшов день?', anchor: 'sleep' },
}

export function normalizeMoodPeriodSettings(value: unknown): MoodPeriodSettings {
	if (!value || typeof value !== 'object') return DEFAULT_MOOD_PERIODS
	const source = value as Partial<Record<MoodPeriodKey, Partial<MoodPeriodSetting>>>
	return {
		morning: normalizePeriod(source.morning, DEFAULT_MOOD_PERIODS.morning),
		day: normalizePeriod(source.day, DEFAULT_MOOD_PERIODS.day),
		evening: normalizePeriod(source.evening, DEFAULT_MOOD_PERIODS.evening),
	}
}

function normalizePeriod(
	value: Partial<MoodPeriodSetting> | undefined,
	fallback: MoodPeriodSetting,
): MoodPeriodSetting {
	const anchor =
		value?.anchor === 'wake' || value?.anchor === 'midday' || value?.anchor === 'sleep'
			? value.anchor
			: fallback.anchor
	return {
		label: normalizeLabel(value?.label, fallback.label),
		question: normalizeLabel(value?.question, fallback.question),
		anchor,
	}
}

function normalizeLabel(value: unknown, fallback: string) {
	return typeof value === 'string' && value.trim()
		? value.trim().slice(0, 40)
		: fallback
}
