import { serverSupabaseUser } from '#supabase/server'
import { requestGeminiWithRetry } from '../../utils/geminiRequest'
import { nutritionSuggestionRequestSchema } from '../../utils/nutritionSuggestionRequest'

interface GeminiResponse {
	candidates?: Array<{
		content?: {
			parts?: Array<{ text?: string }>
		}
	}>
	error?: {
		code?: number
		status?: string
		message?: string
	}
}

const FALLBACK_MODEL = 'gemini-3.5-flash-lite'

function parseJsonObject(text: string) {
	const cleaned = text
		.trim()
		.replace(/^```(?:json)?\s*/i, '')
		.replace(/\s*```$/, '')
	return JSON.parse(cleaned)
}

export default defineEventHandler(async (event) => {
	const user = await serverSupabaseUser(event)
	if (!user) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Потрібно увійти в акаунт.',
		})
	}

	const body = await readBody<unknown>(event)
	const parsedBody = nutritionSuggestionRequestSchema.safeParse(body)
	if (!parsedBody.success) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Перевірте назву, кількість, одиницю та склад продукту.',
		})
	}
	const { name, quantity, unit } = parsedBody.data
	const composition = (parsedBody.data.composition ?? []).join(', ')

	const config = useRuntimeConfig(event)
	const apiKey = String(config.googleGeminiApiKey || '')
	if (!apiKey) {
		throw createError({
			statusCode: 503,
			statusMessage:
				'Підказка ШІ тимчасово недоступна. Можна ввести значення вручну.',
		})
	}

	const model = String(config.googleGeminiModel || FALLBACK_MODEL).replace(
		/^models\//,
		'',
	)
	const prompt = [
		'Ти допомагаєш заповнити довідкову харчову цінність у українському застосунку.',
		'Це оцінка для перевірки користувачем, а не медична норма.',
		`Назва: ${name}`,
		`Довідкова кількість: ${quantity} ${unit === 'g' ? 'г' : unit === 'ml' ? 'мл' : 'шт.'}`,
		composition ? `Склад: ${composition}` : 'Склад невідомий.',
		'Поверни рівно JSON-об’єкт без Markdown:',
		'{"calories":number,"proteins":number,"fats":number,"carbs":number,"confidence":"low|medium|high"}',
		'Вкажи невід’ємні оцінки для вказаної довідкової кількості.',
		'confidence має відображати впевненість у назві та типовому складі продукту.',
	].join('\n')

	const requestBody = JSON.stringify({
		contents: [{ parts: [{ text: prompt }] }],
		generationConfig: {
			responseMimeType: 'application/json',
			responseSchema: {
				type: 'OBJECT',
				required: ['calories', 'proteins', 'fats', 'carbs', 'confidence'],
				properties: {
					calories: { type: 'NUMBER' },
					proteins: { type: 'NUMBER' },
					fats: { type: 'NUMBER' },
					carbs: { type: 'NUMBER' },
					confidence: { type: 'STRING', enum: ['low', 'medium', 'high'] },
				},
			},
		},
	})
	const requestModel = (modelName: string) =>
		fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-goog-api-key': apiKey,
				},
				body: requestBody,
			},
		)

	let response: Response
	try {
		response = await requestGeminiWithRetry(() => requestModel(model))
		if (response.status === 404 && model !== FALLBACK_MODEL) {
			console.warn(
				'[nutrition-suggestion] Configured Gemini model not found; retrying with fallback',
			)
			response = await requestGeminiWithRetry(() =>
				requestModel(FALLBACK_MODEL),
			)
		}
	} catch {
		throw createError({
			statusCode: 502,
			statusMessage:
				'Не вдалося зв’язатися з ШІ. Можна ввести значення вручну.',
		})
	}

	let payload: GeminiResponse = {}
	let payloadDecoded = false
	try {
		const decodedPayload: unknown = await response.json()
		if (
			decodedPayload
			&& typeof decodedPayload === 'object'
			&& !Array.isArray(decodedPayload)
		) {
			payload = decodedPayload as GeminiResponse
			payloadDecoded = true
		}
	} catch {
		payloadDecoded = false
	}

	if (!response.ok) {
		const providerStatus = payload.error?.status
		console.error('[nutrition-suggestion] Gemini request failed', {
			httpStatus: response.status,
			providerStatus,
		})
		const diagnostic = providerStatus ? ` (${providerStatus})` : ''
		const statusMessage =
			response.status === 401 || response.status === 403
				? `Gemini відхилив доступ (HTTP ${response.status}${diagnostic}). Перевірте API-ключ та доступ до моделі.`
				: response.status === 429
					? `Вичерпано ліміт запитів Gemini (HTTP 429${diagnostic}). Спробуйте пізніше.`
					: response.status === 503
						? `Gemini тимчасово недоступний після кількох спроб (HTTP 503${diagnostic}). Спробуйте пізніше або введіть значення вручну.`
					: response.status === 400
						? `Gemini відхилив формат запиту (HTTP 400${diagnostic}). Перевірте назву моделі та її підтримку JSON-відповідей.`
						: `Gemini не зміг сформувати пропозицію (HTTP ${response.status}${diagnostic}). Можна ввести значення вручну.`
		throw createError({
			statusCode: 502,
			statusMessage,
		})
	}

	if (!payloadDecoded) {
		throw createError({
			statusCode: 502,
			statusMessage:
				'ШІ повернув незрозумілу відповідь. Можна ввести значення вручну.',
		})
	}

	const text = payload.candidates?.[0]?.content?.parts
		?.map((part) => part.text ?? '')
		.join('')
	if (!text) {
		throw createError({
			statusCode: 502,
			statusMessage: 'ШІ не повернув пропозицію. Можна ввести значення вручну.',
		})
	}

	try {
		const suggestion = parseJsonObject(text) as Record<string, unknown>
		const keys = ['calories', 'proteins', 'fats', 'carbs'] as const
		const values = Object.fromEntries(
			keys.map((key) => [key, Number(suggestion[key])]),
		)
		if (keys.some((key) => !Number.isFinite(values[key]) || values[key] < 0)) {
			throw new Error('invalid suggestion')
		}
		const confidence = ['low', 'medium', 'high'].includes(
			String(suggestion.confidence),
		)
			? String(suggestion.confidence)
			: 'low'
		return { ...values, confidence }
	} catch {
		throw createError({
			statusCode: 502,
			statusMessage:
				'ШІ повернув незрозумілу пропозицію. Можна ввести значення вручну.',
		})
	}
})
