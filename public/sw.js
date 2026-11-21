self.addEventListener('push', (event) => {
	if (!event.data) {
		console.error('Push event did not include a payload.')
		return
	}

	let payload
	try {
		payload = event.data.json()
	} catch (error) {
		console.error('Push event contained invalid JSON.', error)
		return
	}

	if (typeof payload.title !== 'string' || typeof payload.body !== 'string') {
		console.error('Push event payload is missing its title or body.')
		return
	}

	event.waitUntil(self.registration.showNotification(payload.title, {
		body: payload.body,
		icon: '/icon.svg',
		badge: '/notification-badge.svg',
		tag: typeof payload.tag === 'string' ? payload.tag : 'meal-reminder',
		data: { url: typeof payload.url === 'string' ? payload.url : '/' },
	}))
})

self.addEventListener('notificationclick', (event) => {
	event.notification.close()
	const target = new URL(event.notification.data?.url ?? '/', self.location.origin)
	if (target.origin !== self.location.origin) return

	event.waitUntil((async () => {
		const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
		for (const client of windows) {
			if (client.url === target.href && 'focus' in client) {
				await client.focus()
				return
			}
		}
		await self.clients.openWindow(target.href)
	})())
})
