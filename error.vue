<template>
	<div class="text-center">
		<h2 class="text-2xl font-bold">Error page</h2>
		<pre class="text-left">{{ error }}</pre>
	</div>
</template>

<script lang="ts" setup>
defineProps(['error'])
</script>
