export function getLocalDate(
	date: Date = new Date(),
	timeZone = 'Europe/Kyiv'
): string {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(date)

	const values = Object.fromEntries(
		parts
			.filter((part) => part.type !== 'literal')
			.map((part) => [part.type, part.value])
	)

	return `${values.year}-${values.month}-${values.day}`
}

export function formatLocalHour(
	date: Date | string,
	timeZone = 'Europe/Kyiv'
): string {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		hour: 'numeric',
		hour12: true,
	}).formatToParts(typeof date === 'string' ? new Date(date) : date)
	const hour = parts.find((part) => part.type === 'hour')?.value
	const period = parts.find((part) => part.type === 'dayPeriod')?.value

	if (!hour || !period) throw new Error('Unable to format the local hour.')
	return `${hour}${period.toUpperCase()}`
}

export function formatLocalTime(
	date: Date | string,
	timeZone = 'Europe/Kyiv'
): string {
	return new Intl.DateTimeFormat('uk-UA', {
		timeZone,
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23',
	}).format(typeof date === 'string' ? new Date(date) : date)
}
