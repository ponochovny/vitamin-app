export type MealPeriod = 'morning' | 'day' | 'evening'
export type ReminderScheduleMode = 'preset' | 'custom'

export interface ReminderTimes {
	morning: string
	day: string
	evening: string
}

export const DEFAULT_REMINDER_TIMES: ReminderTimes = {
	morning: '09:00',
	day: '14:00',
	evening: '18:00',
}

const periodWindows: Record<MealPeriod, { start: number; end: number }> = {
	morning: { start: 0, end: 12 * 60 },
	day: { start: 12 * 60, end: 18 * 60 },
	evening: { start: 18 * 60, end: 24 * 60 },
}

export function isValidReminderTimes(times: ReminderTimes): boolean {
	return (Object.keys(periodWindows) as MealPeriod[]).every((period) => {
		const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(times[period])
		if (!match) return false

		const minutes = Number(match[1]) * 60 + Number(match[2])
		const window = periodWindows[period]
		return minutes >= window.start && minutes < window.end
	})
}

export function normalizeReminderTime(value: string): string {
	return value.slice(0, 5)
}
