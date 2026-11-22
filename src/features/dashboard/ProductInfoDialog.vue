<script setup lang="ts">
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/src/shared/ui/dialog'
import type { FoodProductInfo, LoggedFoodInfo } from './foodProduct'

defineProps<{
	open: boolean
	product: FoodProductInfo | null
	logged: LoggedFoodInfo | null
}>()

const emit = defineEmits<{
	'update:open': [open: boolean]
}>()

const nutrientLabels = [
	{ key: 'calories', label: 'Енергія', unit: 'ккал' },
	{ key: 'proteins', label: 'Білки', unit: 'г' },
	{ key: 'fats', label: 'Жири', unit: 'г' },
	{ key: 'carbs', label: 'Вуглеводи', unit: 'г' },
] as const

function unitLabel(unit: FoodProductInfo['chars']['unit'] | undefined) {
	return { g: 'г', ml: 'мл', piece: 'шт.' }[unit ?? 'g']
}

function formatNumber(value: number) {
	return new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 }).format(value)
}
</script>

<template>
	<Dialog :open="open" @update:open="emit('update:open', $event)">
		<DialogContent class="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
			<DialogHeader v-if="product">
				<DialogTitle>{{ product.name }}</DialogTitle>
				<DialogDescription>
					Довідкові значення на {{ formatNumber(product.quantity) }}
					{{ unitLabel(product.chars.unit) }}. Вони можуть бути приблизними.
				</DialogDescription>
			</DialogHeader>

			<div v-if="product" class="space-y-5">
				<section v-if="product.chars.nutritionKnown !== false">
					<h3 class="text-sm font-semibold">Харчова цінність</h3>
					<dl class="mt-2 grid grid-cols-2 gap-2">
						<div
							v-for="nutrient in nutrientLabels"
							:key="nutrient.key"
							class="rounded-xl border border-border/80 px-3 py-2.5"
						>
							<dt class="text-xs text-muted-foreground">{{ nutrient.label }}</dt>
							<dd class="mt-1 font-semibold">
								{{ formatNumber(product.chars[nutrient.key]) }} {{ nutrient.unit }}
							</dd>
						</div>
					</dl>
				</section>
				<p v-else class="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
					Харчову цінність цього продукту ще не зазначено.
				</p>

				<section v-if="logged">
					<h3 class="text-sm font-semibold">У цьому записі</h3>
					<p class="mt-1 text-sm text-muted-foreground">
						{{ formatNumber(logged.quantity) }} {{ unitLabel(product.chars.unit) }}
					</p>
					<dl
						v-if="product.chars.nutritionKnown !== false"
						class="mt-2 grid grid-cols-2 gap-2"
					>
						<div
							v-for="nutrient in nutrientLabels"
							:key="nutrient.key"
							class="rounded-xl bg-muted/60 px-3 py-2.5"
						>
							<dt class="text-xs text-muted-foreground">{{ nutrient.label }}</dt>
							<dd class="mt-1 font-semibold">
								{{ formatNumber(logged.nutrition[nutrient.key]) }} {{ nutrient.unit }}
							</dd>
						</div>
					</dl>
				</section>
			</div>
		</DialogContent>
	</Dialog>
</template>
