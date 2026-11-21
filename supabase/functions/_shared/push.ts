export function isAllowedPushEndpoint(endpoint: URL): boolean {
	return endpoint.protocol === 'https:'
		&& (
			endpoint.hostname === 'fcm.googleapis.com'
			|| endpoint.hostname === 'web.push.apple.com'
			|| endpoint.hostname.endsWith('.push.services.mozilla.com')
			|| endpoint.hostname.endsWith('.notify.windows.com')
		)
}
