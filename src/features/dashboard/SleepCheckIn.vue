<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import {
	calculateSleepDurationMinutes,
	formatSleepDuration,
	normalizeSleepEntryValue,
	SLEEP_QUALITY_OPTIONS,
	type SleepEntryValue,
	type SleepQuality,
} from './sleep'
import { ArrowRight, CalendarDays, MoonStar, Sun, Timer } from 'lucide-vue-next'
import { getLocalDate } from '~/src/shared/date'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/src/shared/ui/dialog'

const props = defineProps<{
	userId: string
	entry?: { id: string; value: SleepEntryValue } | null
}>()

const emit = defineEmits<{
	saved: [entry: { id: string; value: SleepEntryValue }]
}>()

const supabase = useSupabaseClient()
const open = shallowRef(false)
const pending = shallowRef(false)
const error = shallowRef('')
const entryDate = shallowRef(getLocalDate())
const bedtime = shallowRef(props.entry?.value.bedtime ?? '23:00')
const wakeTime = shallowRef(props.entry?.value.wakeTime ?? '07:00')
const quality = shallowRef<SleepQuality>(props.entry?.value.quality ?? 3)

const duration = computed(() =>
	calculateSleepDurationMinutes(bedtime.value, wakeTime.value),
)
const savedDuration = computed(() => {
	if (!props.entry) return null
	return calculateSleepDurationMinutes(
		props.entry.value.bedtime,
		props.entry.value.wakeTime,
	)
})

function openDialog() {
	entryDate.value = getLocalDate()
	bedtime.value = props.entry?.value.bedtime ?? '23:00'
	wakeTime.value = props.entry?.value.wakeTime ?? '07:00'
	quality.value = props.entry?.value.quality ?? 3
	error.value = ''
	open.value = true
}

async function save() {
	if (pending.value) return
	if (!entryDate.value || entryDate.value > getLocalDate()) {
		error.value = 'Оберіть дату сьогодні або раніше.'
		return
	}
	if (!duration.value) {
		error.value = 'Перевірте час засинання та пробудження.'
		return
	}
	pending.value = true
	error.value = ''

	try {
		const option = SLEEP_QUALITY_OPTIONS.find((item) => item.quality === quality.value)!
		const payload = {
			user_id: props.userId,
			kind: 'sleep',
			entry_date: entryDate.value,
			value: {
				quality: quality.value,
				label: option.label,
				bedtime: bedtime.value,
				wakeTime: wakeTime.value,
			} satisfies SleepEntryValue,
			recorded_at: new Date(`${entryDate.value}T12:00:00+02:00`).toISOString(),
		}

		const { data: existing, error: existingError } = await supabase
			.from('wellbeing_entries')
			.select('id')
			.eq('user_id', props.userId)
			.eq('kind', 'sleep')
			.eq('entry_date', entryDate.value)
			.maybeSingle()
		if (existingError) {
			error.value = 'Не вдалося перевірити попередній запис про сон.'
			return
		}

		const request = existing
			? supabase
					.from('wellbeing_entries')
					.update(payload)
					.eq('id', existing.id)
					.eq('user_id', props.userId)
					.select('id, value')
					.single()
			: supabase
					.from('wellbeing_entries')
					.insert(payload)
					.select('id, value')
					.single()
		const { data, error: saveError } = await request
		if (saveError || !data) {
			error.value = 'Не вдалося зберегти сон. Спробуйте ще раз.'
			return
		}
		const savedValue = normalizeSleepEntryValue(data.value)
		if (!savedValue) {
			error.value = 'Збережено некоректні дані про сон.'
			return
		}
		emit('saved', { id: data.id, value: savedValue })
		open.value = false
	} catch {
		error.value = 'Не вдалося зберегти сон через помилку з’єднання. Спробуйте ще раз.'
	} finally {
		pending.value = false
	}
}
</script>

<template>
	<button
		type="button"
		class="sleep-card group flex w-full items-center justify-between gap-3 rounded-2xl border border-[#DDDFEF] bg-[#F1F0FA] px-4 py-3.5 text-left text-[#28324E] transition-colors hover:border-[#BFC2E0] hover:bg-[#ECEBF7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#535B91] sm:px-5"
		@click="openDialog"
	>
		<span class="flex min-w-0 items-center gap-3">
			<span class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#DFDFF1] text-[#535B91]" aria-hidden="true">
				<MoonStar :size="21" :stroke-width="1.8" />
			</span>
			<span class="min-w-0">
				<span class="block text-sm font-bold">Сон</span>
				<span v-if="entry" class="mt-0.5 block truncate text-xs text-[#5B617B]">
					{{ entry.value.bedtime }} — {{ entry.value.wakeTime }} · {{ entry.value.label }}
				</span>
				<span v-else class="mt-0.5 block text-xs text-[#5B617B]">
					Запиши тривалість і якість відпочинку
				</span>
			</span>
		</span>
		<span class="flex shrink-0 items-center gap-2">
			<span v-if="entry && savedDuration" class="text-right">
				<span class="block text-sm font-bold">{{ formatSleepDuration(savedDuration) }}</span>
				<span class="block text-[11px] text-[#5B617B]">за ніч</span>
			</span>
			<span v-else class="text-xs font-semibold text-[#535B91]">Додати</span>
			<ArrowRight
				:size="17"
				:stroke-width="1.8"
				class="text-[#74799E] transition-transform group-hover:translate-x-0.5"
				aria-hidden="true"
			/>
		</span>
	</button>

	<Dialog v-model:open="open">
		<DialogContent class="max-h-[90dvh] overflow-y-auto rounded-[1.5rem] border-[#E5E7EF] bg-white p-5 text-[#26342E] shadow-[0_24px_80px_rgba(27,39,57,0.22)] sm:max-w-md sm:p-6">
			<DialogHeader class="pr-8">
				<div class="flex items-start gap-3">
					<span class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#ECEBFA] text-[#535B91]" aria-hidden="true">
						<MoonStar :size="21" :stroke-width="1.8" />
					</span>
					<div class="space-y-1">
						<DialogTitle class="text-xl font-bold tracking-[-0.02em] text-[#26342E]">
							Як минула ніч?
						</DialogTitle>
						<DialogDescription class="text-sm leading-5 text-[#66736C]">
							Час пробудження визначає дату запису.
						</DialogDescription>
					</div>
				</div>
			</DialogHeader>
			<div class="space-y-5">
				<label class="block space-y-1.5 text-sm font-semibold text-[#3D4A43]">
					<span class="flex items-center gap-2">
						<CalendarDays :size="15" class="text-[#6C769F]" aria-hidden="true" />
						Дата пробудження
					</span>
					<Input
						v-model="entryDate"
						type="date"
						required
						:max="getLocalDate()"
						class="h-11 rounded-xl border-[#DDE3DD] bg-[#F8F9F6] text-[#26342E] focus-visible:ring-[#758A79]"
					/>
				</label>
				<div class="grid grid-cols-2 gap-3">
					<label class="block min-w-0 space-y-1.5 text-sm font-semibold text-[#3D4A43]">
						<span class="flex items-center gap-2">
							<MoonStar :size="15" class="text-[#6C769F]" aria-hidden="true" />
							Заснув
						</span>
						<Input
							v-model="bedtime"
							type="time"
							required
							class="h-12 rounded-xl border-[#DDE3DD] bg-[#F8F9F6] text-base font-semibold text-[#26342E] focus-visible:ring-[#758A79]"
						/>
					</label>
					<label class="block min-w-0 space-y-1.5 text-sm font-semibold text-[#3D4A43]">
						<span class="flex items-center gap-2">
							<Sun :size="15" class="text-[#6C769F]" aria-hidden="true" />
							Прокинувся
						</span>
						<Input
							v-model="wakeTime"
							type="time"
							required
							class="h-12 rounded-xl border-[#DDE3DD] bg-[#F8F9F6] text-base font-semibold text-[#26342E] focus-visible:ring-[#758A79]"
						/>
					</label>
				</div>
				<div
					v-if="duration"
					class="flex items-center justify-between gap-3 rounded-2xl bg-[#F0F1F9] px-4 py-3"
					role="status"
					aria-live="polite"
				>
					<span class="flex items-center gap-2 text-sm font-medium text-[#555D7D]">
						<Timer :size="17" class="text-[#656D9D]" aria-hidden="true" />
						Тривалість сну
					</span>
					<strong class="text-lg font-bold tracking-[-0.02em] text-[#343B69]">
						{{ formatSleepDuration(duration) }}
					</strong>
				</div>
				<fieldset class="space-y-2.5">
					<legend class="text-sm font-semibold text-[#3D4A43]">Як ти оцінюєш відпочинок?</legend>
					<div class="grid grid-cols-5 gap-2">
						<button
							v-for="option in SLEEP_QUALITY_OPTIONS"
							:key="option.quality"
							type="button"
							:aria-pressed="quality === option.quality"
							:disabled="pending"
							:aria-label="`Якість сну: ${option.label}`"
							class="flex min-h-[4.5rem] min-w-0 flex-col items-center justify-center gap-1 rounded-xl border text-center text-[#465248] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#535B91] disabled:cursor-not-allowed disabled:opacity-60"
							:class="quality === option.quality ? 'border-[#535B91] bg-[#535B91] text-white shadow-sm' : 'border-[#E0E4DF] bg-[#FAFBF9] hover:border-[#A9ADC9]'"
							@click="quality = option.quality"
						>
							<span class="text-xl leading-none" aria-hidden="true">{{ option.emoji }}</span>
							<span class="max-w-full truncate px-0.5 text-[10px] font-semibold leading-tight">{{ option.label }}</span>
						</button>
					</div>
				</fieldset>
				<p v-if="error" role="alert" class="rounded-xl border border-[#F0D8D5] bg-[#FFF4F2] px-3 py-2.5 text-sm leading-5 text-[#973B34]">
					{{ error }}
				</p>
				<Button
					type="button"
					class="h-12 w-full rounded-xl bg-[#246B4F] text-sm font-semibold text-white shadow-sm hover:bg-[#1E5B43] focus-visible:ring-2 focus-visible:ring-[#246B4F] focus-visible:ring-offset-2"
					:disabled="pending"
					@click="save"
				>
					{{ pending ? 'Зберігаємо…' : 'Зберегти сон' }}
				</Button>
			</div>
		</DialogContent>
	</Dialog>
</template>
