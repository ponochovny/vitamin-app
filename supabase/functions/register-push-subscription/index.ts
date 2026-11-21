/// <reference lib="deno.ns" />

import { createClient } from 'npm:@supabase/supabase-js@2'
import { isAllowedPushEndpoint } from '../_shared/push.ts'

interface SubscriptionPayload {
	endpoint: string
	auth: string
	p256dh: string
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
	if (!authorization) return jsonResponse({ error: 'Unauthorized.' }, 401)
	if (!supabaseUrl || !anonKey || !serviceRoleKey) {
		console.error('Push subscription function is missing Supabase environment variables.')
		return jsonResponse({ error: 'Push subscription service is not configured.' }, 500)
	}

	try {
		const userClient = createClient(supabaseUrl, anonKey, {
			global: { headers: { Authorization: authorization } },
			auth: { autoRefreshToken: false, persistSession: false },
		})
		const { data: { user }, error: authError } = await userClient.auth.getUser()
		if (authError || !user) return jsonResponse({ error: 'Unauthorized.' }, 401)

		let subscription: Partial<SubscriptionPayload> | null
		try {
			subscription = await request.json() as Partial<SubscriptionPayload>
		} catch {
			return jsonResponse({ error: 'Invalid request body.' }, 400)
		}
		if (
			!subscription
			|| typeof subscription.endpoint !== 'string'
			|| typeof subscription.auth !== 'string'
			|| typeof subscription.p256dh !== 'string'
		) {
			return jsonResponse({ error: 'Invalid push subscription.' }, 400)
		}

		let endpoint: URL
		try {
			endpoint = new URL(subscription.endpoint)
		} catch {
			return jsonResponse({ error: 'Invalid push endpoint.' }, 400)
		}
		if (
			!isAllowedPushEndpoint(endpoint)
			|| !/^[A-Za-z0-9_-]+$/.test(subscription.auth)
			|| !/^[A-Za-z0-9_-]+$/.test(subscription.p256dh)
		) {
			return jsonResponse({ error: 'Invalid push subscription.' }, 400)
		}

		const admin = createClient(supabaseUrl, serviceRoleKey, {
			auth: { autoRefreshToken: false, persistSession: false },
		})
		const { data: existing, error: existingError } = await admin
			.from('push_subscriptions')
			.select('user_id')
			.eq('endpoint', subscription.endpoint)
			.maybeSingle()
		if (existingError) {
			console.error('Could not check existing push subscription:', existingError.message)
			return jsonResponse({ error: 'Could not save push subscription.' }, 500)
		}

		if (existing && existing.user_id !== user.id) {
			return jsonResponse({
				error: 'This device is linked to another account. Disable reminders there first.',
			}, 409)
		}

		if (existing) {
			const { error: updateError } = await admin
				.from('push_subscriptions')
				.update({ auth: subscription.auth, p256dh: subscription.p256dh })
				.eq('endpoint', subscription.endpoint)
			if (updateError) {
				console.error('Could not update push subscription:', updateError.message)
				return jsonResponse({ error: 'Could not save push subscription.' }, 500)
			}
		} else {
			const { error: insertError } = await admin.from('push_subscriptions').insert({
				user_id: user.id,
				endpoint: subscription.endpoint,
				auth: subscription.auth,
				p256dh: subscription.p256dh,
			})
			if (insertError) {
				console.error('Could not save push subscription:', insertError.message)
				return jsonResponse({ error: 'Could not save push subscription.' }, 500)
			}
		}

		return jsonResponse({ registered: true }, 200)
	} catch (cause) {
		console.error('Push subscription registration failed:', cause)
		return jsonResponse({ error: 'Could not register push subscription.' }, 500)
	}
})

function jsonResponse(body: Record<string, unknown>, status: number) {
	return Response.json(body, { status, headers: corsHeaders })
}
