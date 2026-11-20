<template>
	<div class="flex gap-1">
		<NuxtLink to="/" custom v-slot="data">
			<Button
				:variant="!data.isActive ? 'ghost' : 'default'"
				@click="router.push('/')"
			>
				Home
			</Button>
		</NuxtLink>
		<NuxtLink to="/signin" custom v-slot="data">
			<Button
				:variant="!data.isActive ? 'ghost' : 'default'"
				@click="router.push(data.href)"
			>
				Sign In
			</Button>
		</NuxtLink>
		<NuxtLink to="/products/add" custom v-slot="data">
			<Button
				:variant="!data.isActive ? 'ghost' : 'default'"
				@click="router.push(data.href)"
			>
				Add Product
			</Button>
		</NuxtLink>
	</div>
</template>

<script lang="ts" setup>
const router = useRouter()
</script>
