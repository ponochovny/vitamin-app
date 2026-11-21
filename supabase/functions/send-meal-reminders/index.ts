/// <reference lib="deno.ns" />

import { createClient } from 'npm:@supabase/supabase-js@2'
import * as webpush from 'jsr:@negrel/webpush@0.5.0'
import { isAllowedPushEndpoint } from '../_shared/push.ts'

interface ReminderRow {
	user_id: string
	reminder_date: string
	period: 'morning' | 'day' | 'evening'
	missing_food: boolean
	missing_mood: boolean
	endpoint: string
	p256dh: string
	auth: string
}

interface ExportedVapidKeys {
	publicKey: JsonWebKey
	privateKey: JsonWebKey
}

const periodLabels: Record<ReminderRow['period'], string> = {
	morning: 'ранок',
	day: 'день',
	evening: 'вечір',
}

Deno.serve(async (request) => {
	if (request.method !== 'POST') {
		return Response.json({ error: 'Method not allowed.' }, { status: 405 })
	}

	const cronSecret = Deno.env.get('MEAL_REMINDER_CRON_SECRET')
	if (!cronSecret) {
		console.error('Meal reminder function is missing MEAL_REMINDER_CRON_SECRET.')
		return Response.json({ error: 'Push delivery is not configured.' }, { status: 500 })
	}
	if (request.headers.get('x-cron-secret') !== cronSecret) {
		return Response.json({ error: 'Unauthorized.' }, { status: 401 })
	}

	const supabaseUrl = Deno.env.get('SUPABASE_URL')
	const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
	const serializedVapidKeys = Deno.env.get('VAPID_KEYS_JSON')
	const vapidContact = Deno.env.get('VAPID_CONTACT')
	if (!supabaseUrl || !serviceRoleKey || !serializedVapidKeys || !vapidContact) {
		console.error('Meal reminder function is missing required environment variables.')
		return Response.json({ error: 'Push delivery is not configured.' }, { status: 500 })
	}

	try {
		const vapidKeys = await webpush.importVapidKeys(
			JSON.parse(serializedVapidKeys) as ExportedVapidKeys,
			{ extractable: false },
		)
		const applicationServer = await webpush.ApplicationServer.new({
			contactInformation: vapidContact,
			vapidKeys,
		})
		const supabase = createClient(supabaseUrl, serviceRoleKey, {
			auth: { autoRefreshToken: false, persistSession: false },
		})
		const { data, error: claimError } = await supabase.rpc('claim_due_meal_reminders')
		if (claimError) {
			console.error('Could not claim due meal reminders:', claimError.message)
			return Response.json({ error: 'Could not load due reminders.' }, { status: 500 })
		}

		const reminders = (data ?? []) as ReminderRow[]
		const batches = new Map<string, ReminderRow[]>()
		for (const reminder of reminders) {
			const key = `${reminder.user_id}:${reminder.reminder_date}:${reminder.period}`
			const batch = batches.get(key) ?? []
			batch.push(reminder)
			batches.set(key, batch)
		}

		let sent = 0
		let failed = 0
		for (const batch of batches.values()) {
			const reminder = batch[0]
			let delivered = 0
			let lastError = 'All push subscriptions failed.'

			for (const subscription of batch) {
				let endpoint: URL
				try {
					endpoint = new URL(subscription.endpoint)
				} catch {
					lastError = 'Invalid push endpoint.'
					continue
				}

				if (!isAllowedPushEndpoint(endpoint)) {
					lastError = 'Push endpoint host is not supported.'
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
					await subscriber.pushTextMessage(
						JSON.stringify(createNotification(reminder)),
						{
							urgency: webpush.Urgency.High,
							ttl: 3600,
							topic: `${reminder.reminder_date.replace(/-/g, '')}-${reminder.period}`,
						},
					)
					delivered += 1
				} catch (cause) {
					const status = cause instanceof webpush.PushMessageError
						? cause.response.status
						: undefined
					lastError = status ? `Push service returned ${status}.` : 'Push service request failed.'
					console.error('Meal reminder push failed:', {
						period: reminder.period,
						status,
						message: cause instanceof Error ? cause.message : String(cause),
					})

					if (status === 404 || status === 410) {
						const { error: deleteError } = await supabase
							.from('push_subscriptions')
							.delete()
							.eq('user_id', subscription.user_id)
							.eq('endpoint', subscription.endpoint)
						if (deleteError) {
							console.error('Could not remove expired push subscription:', deleteError.message)
						}
					}
				}
			}

			const deliveryUpdate = delivered > 0
				? {
					status: 'sent',
					sent_at: new Date().toISOString(),
					locked_until: new Date().toISOString(),
					last_error: null,
				}
				: {
					status: 'pending',
					locked_until: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
					last_error: lastError,
				}
			const { error: updateError } = await supabase
				.from('meal_reminder_deliveries')
				.update(deliveryUpdate)
				.eq('user_id', reminder.user_id)
				.eq('reminder_date', reminder.reminder_date)
				.eq('period', reminder.period)

			if (updateError) {
				console.error('Could not update meal reminder delivery:', updateError.message)
				failed += 1
				continue
			}

			if (delivered > 0) sent += 1
			else failed += 1
		}

		return Response.json({ claimed: batches.size, sent, failed })
	} catch (cause) {
		console.error('Meal reminder delivery failed:', cause)
		return Response.json({ error: 'Meal reminder delivery failed.' }, { status: 500 })
	}
})

function createNotification(reminder: ReminderRow) {
	const period = periodLabels[reminder.period]
	const requestedTasks = [
		reminder.missing_food ? 'прийом їжі' : null,
		reminder.missing_mood ? 'настрій' : null,
	].filter((task): task is string => task !== null)

	return {
		title: `Vitamin · ${period}`,
		body: `Запишіть ${requestedTasks.join(' та ')} за період «${period}».`,
		url: '/',
		tag: `meal-${reminder.reminder_date}-${reminder.period}`,
	}
}
