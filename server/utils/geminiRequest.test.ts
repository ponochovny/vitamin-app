import { describe, expect, it, vi } from 'vitest'
import { requestGeminiWithRetry } from './geminiRequest'

describe('requestGeminiWithRetry', () => {
	it('retries temporary provider failures with bounded delays', async () => {
		const request = vi.fn()
			.mockResolvedValueOnce(new Response('', { status: 503 }))
			.mockResolvedValueOnce(new Response('', { status: 503 }))
			.mockResolvedValueOnce(new Response('', { status: 200 }))
		const wait = vi.fn(async () => {})

		const response = await requestGeminiWithRetry(request, wait)

		expect(response.status).toBe(200)
		expect(request).toHaveBeenCalledTimes(3)
		expect(wait.mock.calls).toEqual([[500], [1500]])
	})

	it('does not retry non-transient client errors', async () => {
		const request = vi.fn().mockResolvedValue(new Response('', { status: 400 }))
		const wait = vi.fn(async () => {})

		const response = await requestGeminiWithRetry(request, wait)

		expect(response.status).toBe(400)
		expect(request).toHaveBeenCalledTimes(1)
		expect(wait).not.toHaveBeenCalled()
	})
})
