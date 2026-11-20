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
