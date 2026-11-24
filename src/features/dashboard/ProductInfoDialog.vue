<script setup lang="ts">
import { reactive, shallowRef } from 'vue'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/src/shared/ui/dialog'
import type { FoodProductInfo, LoggedFoodInfo } from './foodProduct'

const props = defineProps<{
	open: boolean
	product: FoodProductInfo | null
	logged: LoggedFoodInfo | null
}>()

const emit = defineEmits<{
	'update:open': [open: boolean]
	saved: [product: FoodProductInfo]
}>()

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const editing = shallowRef(false)
const pending = shallowRef(false)
const editError = shallowRef('')
const editSuccess = shallowRef('')
const draft = reactive<Record<'calories' | 'proteins' | 'fats' | 'carbs', string | number>>({
	calories: '',
	proteins: '',
	fats: '',
	carbs: '',
})

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

function startEditing() {
	if (!props.product || !user.value) return
	for (const { key } of nutrientLabels) {
		draft[key] =
			props.product.chars.nutritionKnown === false
				? ''
				: String(props.product.chars[key])
	}
	editError.value = ''
	editSuccess.value = ''
	editing.value = true
}

function cancelEditing() {
	editing.value = false
	editError.value = ''
}

function updateOpen(open: boolean) {
	if (!open) {
		editing.value = false
		editError.value = ''
		editSuccess.value = ''
	}
	emit('update:open', open)
}

async function saveNutrition() {
	const product = props.product
	const userId = user.value?.id
	if (!product || !userId || pending.value) return

	const values = {
		calories: Number(draft.calories),
		proteins: Number(draft.proteins),
		fats: Number(draft.fats),
		carbs: Number(draft.carbs),
	}
	if (
		nutrientLabels.some(
			({ key }) =>
				!String(draft[key]).trim() ||
				!Number.isFinite(values[key]) ||
				values[key] < 0,
		)
	) {
		editError.value = 'Вкажіть невід’ємні числові значення для всіх полів.'
		return
	}

	pending.value = true
	editError.value = ''
	editSuccess.value = ''
	const chars = {
		...product.chars,
		...values,
		nutritionKnown: true,
	}
	const { data, error } = await supabase
		.from('products')
		.update({ chars })
		.eq('id', product.id)
		.eq('user_id', userId)
		.select('id, name, quantity, chars')
		.maybeSingle()
	pending.value = false

	if (error || !data) {
		editError.value = 'Не вдалося зберегти зміни. Перевірте з’єднання та спробуйте ще раз.'
		return
	}

	emit('saved', {
		id: data.id,
		name: data.name,
		quantity: Number(data.quantity),
		chars: { ...chars, ...data.chars },
	})
	editing.value = false
	editSuccess.value =
		'Харчову цінність збережено. Усі записи цього продукту в журналі перераховано за новими значеннями.'
}
</script>

<template>
	<Dialog :open="open" @update:open="updateOpen">
		<DialogContent class="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
			<DialogHeader v-if="product">
				<DialogTitle>{{ product.name }}</DialogTitle>
				<DialogDescription>
					Довідкові значення на {{ formatNumber(product.quantity) }}
					{{ unitLabel(product.chars.unit) }}. Вони можуть бути приблизними.
				</DialogDescription>
			</DialogHeader>

			<div v-if="product" class="space-y-5">
				<section>
					<div class="flex items-center justify-between gap-3">
						<h3 class="text-sm font-semibold">Харчова цінність</h3>
						<Button
							v-if="user && product.id"
							type="button"
							variant="outline"
							size="sm"
							:disabled="pending"
							@click="startEditing"
						>
							Редагувати
						</Button>
					</div>
					<form v-if="editing" class="mt-3 space-y-3" @submit.prevent="saveNutrition">
						<p class="text-sm text-muted-foreground">
							Вкажіть значення для {{ formatNumber(product.quantity) }}
							{{ unitLabel(product.chars.unit) }} — саме така кількість є довідковою для цього продукту.
						</p>
						<label
							v-for="nutrient in nutrientLabels"
							:key="nutrient.key"
							class="block space-y-1 text-sm font-medium"
						>
							<span>{{ nutrient.label }}, {{ nutrient.unit }}</span>
							<Input
								v-model="draft[nutrient.key]"
								type="number"
								min="0"
								step="any"
								required
							/>
						</label>
						<p v-if="editError" role="alert" class="text-sm text-destructive">
							{{ editError }}
						</p>
						<div class="flex gap-2">
							<Button type="submit" :disabled="pending">
								{{ pending ? 'Зберігаємо…' : 'Зберегти' }}
							</Button>
							<Button type="button" variant="outline" :disabled="pending" @click="cancelEditing">
								Скасувати
							</Button>
						</div>
					</form>
					<dl class="mt-2 grid grid-cols-2 gap-2">
						<template v-if="!editing && product.chars.nutritionKnown !== false">
							<div
								v-for="nutrient in nutrientLabels"
								:key="nutrient.key"
								class="rounded-xl border border-border/80 px-3 py-2.5"
							>
								<dt class="text-xs text-muted-foreground">
									{{ nutrient.label }}
								</dt>
								<dd class="mt-1 font-semibold">
									{{ formatNumber(product.chars[nutrient.key]) }}
									{{ nutrient.unit }}
								</dd>
							</div>
						</template>
					</dl>
					<p
						v-if="!editing && product.chars.nutritionKnown === false"
						class="mt-2 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground"
					>
						Харчову цінність цього продукту ще не зазначено.
					</p>
				</section>
				<p v-if="editSuccess" role="status" class="text-sm text-green-700">
					{{ editSuccess }}
				</p>

				<section v-if="logged">
					<h3 class="text-sm font-semibold">
						У збереженому записі
					</h3>
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
