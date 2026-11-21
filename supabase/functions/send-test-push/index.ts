/// <reference lib="deno.ns" />

import { createClient } from 'npm:@supabase/supabase-js@2'
import * as webpush from 'jsr:@negrel/webpush@0.5.0'
import { isAllowedPushEndpoint } from '../_shared/push.ts'

interface ExportedVapidKeys {
	publicKey: JsonWebKey
	privateKey: JsonWebKey
}

interface PushSubscription {
	endpoint: string
	p256dh: string
	auth: string
}

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (request) => {
	if (request.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders })
	}

	if (request.method !== 'POST') {
		return jsonResponse({ error: 'Method not allowed.' }, 405)
	}

	const authorization = request.headers.get('authorization')
	const supabaseUrl = Deno.env.get('SUPABASE_URL')
	const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
	const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
	const serializedVapidKeys = Deno.env.get('VAPID_KEYS_JSON')
	const vapidContact = Deno.env.get('VAPID_CONTACT')
	if (!authorization) return jsonResponse({ error: 'Unauthorized.' }, 401)
	if (!supabaseUrl || !anonKey || !serviceRoleKey || !serializedVapidKeys || !vapidContact) {
		console.error('Test push function is missing required environment variables.')
		return jsonResponse({ error: 'Push delivery is not configured.' }, 500)
	}

	try {
		const userClient = createClient(supabaseUrl, anonKey, {
			global: { headers: { Authorization: authorization } },
			auth: { autoRefreshToken: false, persistSession: false },
		})
		const { data: { user }, error: authError } = await userClient.auth.getUser()
		if (authError || !user) return jsonResponse({ error: 'Unauthorized.' }, 401)

		const admin = createClient(supabaseUrl, serviceRoleKey, {
			auth: { autoRefreshToken: false, persistSession: false },
		})
		const { data: subscriptions, error: subscriptionError } = await admin
			.from('push_subscriptions')
			.select('endpoint, p256dh, auth')
			.eq('user_id', user.id)
		if (subscriptionError) {
			console.error('Could not load push subscriptions:', subscriptionError.message)
			return jsonResponse({ error: 'Could not load push subscriptions.' }, 500)
		}
		if (!subscriptions?.length) {
			return jsonResponse({ error: 'Enable notifications on a device before sending a test.' }, 409)
		}

		const vapidKeys = await webpush.importVapidKeys(
			JSON.parse(serializedVapidKeys) as ExportedVapidKeys,
			{ extractable: false },
		)
		const applicationServer = await webpush.ApplicationServer.new({
			contactInformation: vapidContact,
			vapidKeys,
		})
		const payload = JSON.stringify({
			title: 'Vitamin · Тест',
			body: 'Це тестове сповіщення. Перевірте, чи показує його ваш пристрій.',
			url: '/',
			tag: `test-${crypto.randomUUID()}`,
		})

		let sent = 0
		let failed = 0
		for (const subscription of subscriptions as PushSubscription[]) {
			let endpoint: URL
			try {
				endpoint = new URL(subscription.endpoint)
			} catch {
				failed += 1
				console.error('Skipped invalid push endpoint.')
				continue
			}

			if (!isAllowedPushEndpoint(endpoint)) {
				failed += 1
				console.error('Skipped unsupported push endpoint host:', endpoint.hostname)
				continue
			}

			try {
				const subscriber = applicationServer.subscribe({
					endpoint: subscription.endpoint,
					keys: {
						auth: subscription.auth,
						p256dh: subscription.p256dh,
					},
				})
				await subscriber.pushTextMessage(payload, {
					urgency: webpush.Urgency.High,
					ttl: 3600,
				})
				sent += 1
			} catch (cause) {
				failed += 1
				const status = cause instanceof webpush.PushMessageError
					? cause.response.status
					: undefined
				console.error('Test push failed:', {
					status,
					message: cause instanceof Error ? cause.message : String(cause),
				})

				if (status === 404 || status === 410) {
					const { error: deleteError } = await admin
						.from('push_subscriptions')
						.delete()
						.eq('user_id', user.id)
						.eq('endpoint', subscription.endpoint)
					if (deleteError) {
						console.error('Could not remove expired push subscription:', deleteError.message)
					}
				}
			}
		}

		if (sent === 0) {
			return jsonResponse({ error: 'The push service did not accept the test notification.', sent, failed }, 502)
		}

		return jsonResponse({ sent, failed }, 200)
	} catch (cause) {
		console.error('Test push delivery failed:', cause)
		return jsonResponse({ error: 'Could not send the test notification.' }, 500)
	}
})

function jsonResponse(body: Record<string, unknown>, status: number) {
	return Response.json(body, { status, headers: corsHeaders })
}
