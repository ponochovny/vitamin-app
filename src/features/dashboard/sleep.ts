export type SleepQuality = 1 | 2 | 3 | 4 | 5

export interface SleepEntryValue {
	quality: SleepQuality
	label: string
	bedtime: string
	wakeTime: string
}

export const SLEEP_QUALITY_OPTIONS: ReadonlyArray<{
	quality: SleepQuality
	label: string
	emoji: string
}> = [
	{ quality: 1, label: 'Погано', emoji: '😞' },
	{ quality: 2, label: 'Слабко', emoji: '😕' },
	{ quality: 3, label: 'Звичайно', emoji: '😐' },
	{ quality: 4, label: 'Добре', emoji: '🙂' },
	{ quality: 5, label: 'Чудово', emoji: '😄' },
]

export function normalizeSleepEntryValue(value: unknown): SleepEntryValue | null {
	if (!value || typeof value !== 'object') return null
	const source = value as Partial<SleepEntryValue>
	const quality = SLEEP_QUALITY_OPTIONS.find((option) => option.quality === source.quality)
	if (!quality || !isTime(source.bedtime) || !isTime(source.wakeTime)) return null
	return {
		quality: quality.quality,
		label: quality.label,
		bedtime: source.bedtime,
		wakeTime: source.wakeTime,
	}
}

export function calculateSleepDurationMinutes(bedtime: string, wakeTime: string): number | null {
	if (!isTime(bedtime) || !isTime(wakeTime)) return null
	const bedtimeMinutes = toMinutes(bedtime)
	const wakeMinutes = toMinutes(wakeTime)
	const duration = wakeMinutes >= bedtimeMinutes
		? wakeMinutes - bedtimeMinutes
		: 24 * 60 - bedtimeMinutes + wakeMinutes
	return duration > 0 && duration <= 24 * 60 ? duration : null
}

export function formatSleepDuration(minutes: number): string {
	const hours = Math.floor(minutes / 60)
	const remainingMinutes = minutes % 60
	if (!remainingMinutes) return `${hours} г`
	return `${hours} г ${remainingMinutes} хв`
}

function isTime(value: unknown): value is string {
	return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

function toMinutes(value: string) {
	const [hours, minutes] = value.split(':').map(Number)
	return hours * 60 + minutes
}
