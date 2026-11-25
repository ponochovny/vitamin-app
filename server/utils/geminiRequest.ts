const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504])
const RETRY_DELAYS_MS = [500, 1500] as const

const delay = (milliseconds: number) =>
	new Promise<void>((resolve) => setTimeout(resolve, milliseconds))

export async function requestGeminiWithRetry(
	request: () => Promise<Response>,
	wait: (milliseconds: number) => Promise<void> = delay,
) {
	for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
		try {
			const response = await request()
			if (
				!RETRYABLE_STATUSES.has(response.status)
				|| attempt === RETRY_DELAYS_MS.length
			) {
				return response
			}
			console.warn('[nutrition-suggestion] Retrying transient Gemini response', {
				attempt: attempt + 1,
				httpStatus: response.status,
			})
		} catch (cause) {
			if (attempt === RETRY_DELAYS_MS.length) throw cause
			console.warn('[nutrition-suggestion] Retrying Gemini after network failure', {
				attempt: attempt + 1,
			})
		}

		await wait(RETRY_DELAYS_MS[attempt])
	}

	throw new Error('Gemini retry attempts exhausted')
}
