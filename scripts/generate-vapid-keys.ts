import * as webpush from 'jsr:@negrel/webpush@0.5.0'

const keys = await webpush.generateVapidKeys({ extractable: true })
const exportedKeys = await webpush.exportVapidKeys(keys)
const publicKey = await webpush.exportApplicationServerKey(keys)

console.log(`NUXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKey}`)
console.log(`VAPID_KEYS_JSON=${JSON.stringify(exportedKeys)}`)
