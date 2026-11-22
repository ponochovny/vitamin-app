<template>
	<div>
		<SignIn />
	</div>
</template>

<script lang="ts" setup>
import SignIn from '../features/auth/signIn.vue'

useSeoMeta({
	title: 'Вхід до Vitamin',
	description: 'Увійдіть до Vitamin, щоб зберігати цілі, записи їжі, води та самопочуття.',
	robots: 'noindex,follow',
})
</script>
