export function parseDecimalInput(value: string): number {
	const normalized = value.trim().replace(',', '.')
	if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return Number.NaN
	return Number(normalized)
}
