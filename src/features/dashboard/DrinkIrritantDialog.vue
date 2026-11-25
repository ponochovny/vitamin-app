<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/src/shared/ui/dialog'
import {
	IRRITANT_INGREDIENT_MAX_LENGTH,
	IRRITANT_REASON_MAX_LENGTH,
	parseProductIrritant,
} from '~/src/entities/product/irritant'
import type { DrinkTypeDetails } from './drinkType'

const props = withDefaults(defineProps<{
	open: boolean
	drink: DrinkTypeDetails | null
	editable?: boolean
	pending?: boolean
	requestError?: string
}>(), {
	editable: false,
	pending: false,
	requestError: '',
})

const emit = defineEmits<{
	'update:open': [open: boolean]
	save: [annotation: { ingredient: string; reason: string } | null]
}>()

const irritantMarked = shallowRef(false)
const irritantIngredient = shallowRef('')
const irritantReason = shallowRef('')
const formError = shallowRef('')

watch(
	() => [props.open, props.drink] as const,
	([open, drink]) => {
		if (!open || !drink) return
		irritantMarked.value = Boolean(drink.irritant_ingredient)
		irritantIngredient.value = drink.irritant_ingredient ?? ''
		irritantReason.value = drink.irritant_reason ?? ''
		formError.value = ''
	},
	{ immediate: true },
)

function saveAnnotation() {
	const result = parseProductIrritant(
		irritantMarked.value ? irritantIngredient.value : '',
		irritantMarked.value ? irritantReason.value : '',
	)
	if (!result.valid) {
		formError.value =
			result.reason === 'incomplete'
				? 'Укажіть компонент і пояснення.'
				: 'Перевірте довжину полів помітки.'
		return
	}
	formError.value = ''
	emit('save', result.value)
}
</script>

<template>
	<Dialog :open="open" @update:open="emit('update:open', $event)">
		<DialogContent class="max-h-[85dvh] overflow-y-auto sm:max-w-md">
			<DialogHeader v-if="drink">
				<DialogTitle>{{ drink.name }}</DialogTitle>
				<DialogDescription>
					Помітка застосовується до всіх записів цього виду. Це особисте
					спостереження, а не медичний висновок.
				</DialogDescription>
			</DialogHeader>
			<form v-if="editable && drink" class="space-y-4" @submit.prevent="saveAnnotation">
				<fieldset class="space-y-3 rounded-xl border border-border p-3">
					<legend class="px-1 text-sm font-semibold">Особиста помітка</legend>
					<label class="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
						<input
							v-model="irritantMarked"
							type="checkbox"
							:disabled="pending"
							class="size-4 accent-primary"
						/>
						Позначити можливим подразником
					</label>
					<template v-if="irritantMarked">
						<label class="block space-y-1 text-sm font-medium">
							<span>Інгредієнт або компонент</span>
							<input
								v-model="irritantIngredient"
								type="text"
								:maxlength="IRRITANT_INGREDIENT_MAX_LENGTH"
								:disabled="pending"
								class="h-11 w-full rounded-md border border-input bg-background px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
							/>
						</label>
						<label class="block space-y-1 text-sm font-medium">
							<span>Чому позначено</span>
							<textarea
								v-model="irritantReason"
								:maxlength="IRRITANT_REASON_MAX_LENGTH"
								rows="3"
								:disabled="pending"
								class="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
							/>
						</label>
					</template>
				</fieldset>
				<p v-if="formError" role="alert" class="text-sm text-destructive">
					{{ formError }}
				</p>
				<p v-if="requestError" role="alert" class="text-sm text-destructive">
					{{ requestError }}
				</p>
				<Button type="submit" class="min-h-11 w-full" :disabled="pending">
					{{ pending ? 'Зберігаю…' : 'Зберегти помітку' }}
				</Button>
			</form>
			<section
				v-else-if="drink?.irritant_ingredient && drink.irritant_reason"
				aria-labelledby="drink-irritant-heading"
				class="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950"
			>
				<h2 id="drink-irritant-heading" class="font-semibold">
					Можливий подразник
				</h2>
				<dl class="mt-3 space-y-2 text-sm">
					<div>
						<dt class="font-semibold">Інгредієнт або компонент</dt>
						<dd>{{ drink.irritant_ingredient }}</dd>
					</div>
					<div>
						<dt class="font-semibold">Чому позначено</dt>
						<dd>{{ drink.irritant_reason }}</dd>
					</div>
				</dl>
			</section>
		</DialogContent>
	</Dialog>
</template>
