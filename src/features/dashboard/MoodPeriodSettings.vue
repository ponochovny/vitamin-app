<script setup lang="ts">
import { computed, onMounted, reactive, shallowRef } from 'vue'
import {
	DEFAULT_MOOD_PERIODS,
	normalizeMoodPeriodSettings,
	type MoodPeriodKey,
	type MoodPeriodSettings,
} from './moodPeriods'

const props = defineProps<{ userId: string }>()
const supabase = useSupabaseClient()
const loading = shallowRef(true)
const pending = shallowRef(false)
const error = shallowRef('')
const notice = shallowRef('')
const periods = reactive<MoodPeriodSettings>(normalizeMoodPeriodSettings(null))
const keys: MoodPeriodKey[] = ['morning', 'day', 'evening']
const anchors = [
	{ value: 'wake', label: 'Пробудження' },
	{ value: 'midday', label: 'Середина дня' },
	{ value: 'sleep', label: 'Перед сном' },
] as const

const valid = computed(() =>
	keys.every((key) =>
		periods[key].label.trim().length > 0
		&& periods[key].question.trim().length > 0,
	),
)

onMounted(() => {
	void load()
})

async function load() {
	loading.value = true
	error.value = ''
	const { data, error: loadError } = await supabase
		.from('profiles')
		.select('mood_periods')
		.eq('id', props.userId)
		.maybeSingle()
	if (loadError) {
		error.value = 'Не вдалося завантажити моменти настрою.'
		loading.value = false
		return
	}
	Object.assign(periods, normalizeMoodPeriodSettings(data?.mood_periods))
	loading.value = false
}

async function save() {
	if (!valid.value || pending.value) {
		error.value = 'Заповніть назву та запитання для кожного моменту.'
		return
	}
	pending.value = true
	error.value = ''
	notice.value = ''
	const payload = Object.fromEntries(
		keys.map((key) => [key, {
			label: periods[key].label.trim(),
			question: periods[key].question.trim(),
			anchor: periods[key].anchor,
		}]),
	)
	const { error: saveError } = await supabase
		.from('profiles')
		.upsert({ id: props.userId, mood_periods: payload })
	pending.value = false
	if (saveError) {
		error.value = 'Не вдалося зберегти моменти настрою.'
		return
	}
	notice.value = 'Моменти настрою збережено.'
}

function resetDefaults() {
	Object.assign(periods, DEFAULT_MOOD_PERIODS)
	error.value = ''
	notice.value = ''
}
</script>

<template>
	<section class="mt-5 border-t border-border/70 pt-5">
		<h2 class="text-lg font-bold">Моменти настрою</h2>
		<p class="mt-1 text-sm text-muted-foreground">
			Назвіть три моменти за вашим режимом. Прив’язка до пробудження, середини
			дня або сну важливіша за жорсткий годинник.
		</p>
		<form v-if="!loading" class="mt-4 space-y-4" @submit.prevent="save">
			<fieldset
				v-for="key in keys"
				:key="key"
				class="space-y-3 rounded-2xl border border-border p-3"
			>
				<legend class="px-1 text-sm font-semibold">{{ DEFAULT_MOOD_PERIODS[key].label }}</legend>
				<label class="block space-y-1 text-sm font-medium">
					<span>Назва моменту</span>
					<Input v-model="periods[key].label" :maxlength="40" required />
				</label>
				<label class="block space-y-1 text-sm font-medium">
					<span>Запитання</span>
					<Input v-model="periods[key].question" :maxlength="40" required />
				</label>
				<label class="block space-y-1 text-sm font-medium">
					<span>Прив’язка</span>
					<select
						v-model="periods[key].anchor"
						class="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
					>
						<option
							v-for="anchor in anchors"
							:key="anchor.value"
							:value="anchor.value"
						>
							{{ anchor.label }}
						</option>
					</select>
				</label>
			</fieldset>
			<p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>
			<p v-if="notice" role="status" class="text-sm text-green-700">{{ notice }}</p>
			<div class="flex gap-2">
				<Button type="submit" :disabled="pending || !valid">
					{{ pending ? 'Зберігаю…' : 'Зберегти моменти' }}
				</Button>
				<Button type="button" variant="outline" :disabled="pending" @click="resetDefaults">
					Скинути
				</Button>
			</div>
		</form>
		<p v-else class="mt-4 text-sm text-muted-foreground">Завантажую налаштування…</p>
	</section>
</template>
