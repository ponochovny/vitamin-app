<script setup lang="ts">
import { Droplets, Leaf, Smile, Utensils } from 'lucide-vue-next'

const features = [
	{
		icon: Utensils,
		title: 'Їжа без зайвої складності',
		description: 'Записуй прийоми їжі та дивись на поживність у контексті свого дня.',
	},
	{
		icon: Droplets,
		title: 'Вода у власному ритмі',
		description: 'Відстежуй випите й рухайся до своєї щоденної цілі.',
	},
	{
		icon: Smile,
		title: 'Самопочуття, яке має значення',
		description: 'Помічай настрій протягом дня, щоб краще розуміти свої звички.',
	},
]

useSeoMeta({
	title: 'Прев’ю Vitamin',
	description: 'Дізнайся, як Vitamin допомагає помічати їжу, воду та самопочуття у щоденному ритмі.',
	ogTitle: 'Vitamin — щоденник турботи про себе',
	ogDescription: 'Їжа, вода, цілі та настрій — у простому щоденному щоденнику.',
})
</script>

<template>
	<main class="preview-page pb-16 pt-8 sm:pt-12">
		<section class="preview-hero" aria-labelledby="preview-title">
			<div class="preview-copy">
				<p class="preview-kicker">
					<Leaf :size="16" aria-hidden="true" />
					Щоденник турботи про себе
				</p>
				<h1 id="preview-title" class="preview-title">
					Помічай, що підтримує тебе щодня.
				</h1>
				<p class="preview-intro">
					Vitamin збирає в одному місці їжу, воду, особисті цілі та настрій —
					без оцінок і тиску. Маленькі спостереження допомагають краще чути себе.
				</p>
				<div class="preview-actions">
					<NuxtLink
						to="/signin"
						class="preview-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
					>
						Увійти або створити акаунт
					</NuxtLink>
					<a
						href="#what-you-can-track"
						class="preview-secondary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
					>
						Що можна відстежувати
					</a>
				</div>
			</div>

			<div class="preview-art" role="group" aria-label="Приклад щоденника Vitamin">
				<div class="preview-orbit preview-orbit--outer" aria-hidden="true" />
				<div class="preview-orbit preview-orbit--inner" aria-hidden="true" />
				<article class="day-card">
					<header class="day-card__header">
						<div>
							<p class="day-card__eyebrow">Приклад щоденника</p>
							<h2 class="day-card__title">Твій день</h2>
						</div>
						<span class="day-card__sun" aria-hidden="true">☀</span>
					</header>

					<div class="day-card__goal">
						<div class="day-card__goal-top">
							<span>Вода</span>
							<strong>4 з 8 склянок</strong>
						</div>
						<div class="water-track" role="img" aria-label="Випито 4 з 8 склянок води">
							<span class="water-track__fill" />
						</div>
						<p class="day-card__hint">По склянці за раз — теж прогрес</p>
					</div>

					<div class="day-card__timeline">
						<div class="timeline-entry">
							<span class="timeline-entry__dot timeline-entry__dot--lime" aria-hidden="true" />
							<div>
								<p class="timeline-entry__time">Ранок</p>
								<p class="timeline-entry__name">Сніданок</p>
							</div>
							<span class="timeline-entry__detail">вівсянка, яблуко</span>
						</div>
						<div class="timeline-entry">
							<span class="timeline-entry__dot timeline-entry__dot--blue" aria-hidden="true" />
							<div>
								<p class="timeline-entry__time">День</p>
								<p class="timeline-entry__name">Вода</p>
							</div>
							<span class="timeline-entry__detail">ще 2 склянки</span>
						</div>
						<div class="timeline-entry timeline-entry--mood">
							<span class="timeline-entry__mood" aria-hidden="true">🙂</span>
							<div>
								<p class="timeline-entry__time">Зараз</p>
								<p class="timeline-entry__name">Як ти почуваєшся?</p>
							</div>
							<span class="mood-mark" aria-hidden="true">● ● ●</span>
						</div>
					</div>
				</article>
				<p class="preview-art-note">Твій темп. Твої спостереження.</p>
			</div>
		</section>

		<section id="what-you-can-track" class="preview-features" aria-labelledby="features-title">
			<div class="preview-features__heading">
				<p class="preview-section-label">Три частини одного дня</p>
				<h2 id="features-title">Звертай увагу на важливе для тебе.</h2>
			</div>
			<div class="feature-list">
				<article v-for="feature in features" :key="feature.title" class="feature-row">
					<span class="feature-row__icon">
						<component :is="feature.icon" :size="21" aria-hidden="true" />
					</span>
					<div class="feature-row__copy">
						<h3>{{ feature.title }}</h3>
						<p>{{ feature.description }}</p>
					</div>
				</article>
			</div>
		</section>

		<section class="preview-note" aria-labelledby="note-title">
			<div class="preview-note__mark" aria-hidden="true">“</div>
			<div>
				<h2 id="note-title">Не потрібно робити все ідеально.</h2>
				<p>
					Веди записи так, як зручно тобі. Vitamin допомагає бачити зв’язки й
					підтримувати звички — крок за кроком.
				</p>
			</div>
			<NuxtLink
				to="/signin"
				class="preview-note__link focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
			>
				Почати з Vitamin
			</NuxtLink>
		</section>
	</main>
</template>

<style scoped>
.preview-page {
	--preview-ink: #20352b;
	--preview-green: #246b4f;
	--preview-lime: #d7f26a;
	--preview-mist: #edf5eb;
	color: var(--preview-ink);
}

.preview-hero {
	display: grid;
	align-items: center;
	gap: 2rem;
}

.preview-copy {
	max-width: 39rem;
	padding: 0.75rem 0.25rem;
}

.preview-kicker {
	display: inline-flex;
	align-items: center;
	gap: 0.55rem;
	margin: 0;
	color: var(--preview-green);
	font-size: 0.875rem;
	font-weight: 700;
}

.preview-title {
	max-width: 11ch;
	margin: 1.1rem 0 0;
	font-size: clamp(2.65rem, 7vw, 5.25rem);
	font-weight: 750;
	letter-spacing: -0.07em;
	line-height: 0.99;
}

.preview-intro {
	max-width: 34rem;
	margin: 1.35rem 0 0;
	color: #53665b;
	font-size: 1.05rem;
	line-height: 1.75;
}

.preview-actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.75rem 1.25rem;
	margin-top: 1.8rem;
}

.preview-primary,
.preview-secondary {
	display: inline-flex;
	min-height: 3rem;
	align-items: center;
	justify-content: center;
	border-radius: 0.95rem;
	font-size: 0.9rem;
	font-weight: 700;
	text-decoration: none;
	transition:
		background-color 160ms ease,
		color 160ms ease,
		transform 160ms ease;
}

.preview-primary {
	padding: 0.75rem 1.15rem;
	background: var(--preview-green);
	box-shadow: 0 9px 22px rgb(36 107 79 / 16%);
	color: white;
}

.preview-primary:hover {
	transform: translateY(-1px);
	background: #1d5b41;
}

.preview-secondary {
	color: var(--preview-green);
}

.preview-secondary:hover {
	color: #173f30;
}

.preview-art {
	position: relative;
	display: grid;
	min-height: 29rem;
	place-items: center;
	isolation: isolate;
}

.preview-art::before {
	position: absolute;
	z-index: -1;
	width: min(91%, 27rem);
	aspect-ratio: 1;
	border-radius: 46% 54% 60% 40% / 42% 42% 58% 58%;
	background: var(--preview-mist);
	content: "";
	transform: rotate(-9deg);
}

.preview-orbit {
	position: absolute;
	z-index: -1;
	border: 1px solid rgb(36 107 79 / 12%);
	border-radius: 50%;
}

.preview-orbit--outer {
	width: min(100%, 30rem);
	aspect-ratio: 1;
}

.preview-orbit--inner {
	width: min(77%, 23rem);
	aspect-ratio: 1;
}

.day-card {
	width: min(88%, 25rem);
	padding: 1.35rem;
	border: 1px solid rgb(32 53 43 / 7%);
	border-radius: 1.65rem;
	background: #fff;
	box-shadow: 0 24px 70px rgb(32 53 43 / 12%);
	transform: rotate(1.2deg);
}

.day-card__header,
.day-card__goal-top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
}

.day-card__eyebrow,
.day-card__title,
.day-card__hint,
.timeline-entry p {
	margin: 0;
}

.day-card__eyebrow {
	color: #728078;
	font-size: 0.7rem;
	font-weight: 600;
}

.day-card__title {
	margin-top: 0.2rem;
	font-size: 1.4rem;
	font-weight: 750;
	letter-spacing: -0.05em;
}

.day-card__sun {
	display: grid;
	width: 2.5rem;
	height: 2.5rem;
	place-items: center;
	border-radius: 50%;
	background: #f2f7d8;
	color: var(--preview-green);
	font-size: 1.1rem;
}

.day-card__goal {
	margin-top: 1.3rem;
	padding: 1rem;
	border-radius: 1.1rem;
	background: #f4f8ef;
}

.day-card__goal-top {
	font-size: 0.8rem;
}

.day-card__goal-top strong {
	color: var(--preview-green);
	font-size: 0.76rem;
}

.water-track {
	height: 0.45rem;
	overflow: hidden;
	margin-top: 0.75rem;
	border-radius: 99px;
	background: #dce8df;
}

.water-track__fill {
	display: block;
	width: 50%;
	height: 100%;
	border-radius: inherit;
	background: var(--preview-green);
}

.day-card__hint {
	margin-top: 0.55rem;
	color: #738078;
	font-size: 0.67rem;
}

.day-card__timeline {
	position: relative;
	display: grid;
	gap: 1.1rem;
	margin: 1.3rem 0 0 0.25rem;
}

.day-card__timeline::before {
	position: absolute;
	top: 0.5rem;
	bottom: 0.6rem;
	left: 0.34rem;
	width: 1px;
	background: #e4ebe5;
	content: "";
}

.timeline-entry {
	position: relative;
	display: grid;
	grid-template-columns: 0.7rem minmax(5.5rem, 1fr) auto;
	align-items: center;
	gap: 0.65rem;
}

.timeline-entry__dot {
	z-index: 1;
	width: 0.7rem;
	height: 0.7rem;
	border: 2px solid white;
	border-radius: 50%;
	box-shadow: 0 0 0 1px #dce7dc;
}

.timeline-entry__dot--lime {
	background: #b6d84e;
}

.timeline-entry__dot--blue {
	background: #78bec3;
}

.timeline-entry__time {
	color: #859087;
	font-size: 0.65rem;
}

.timeline-entry__name {
	margin-top: 0.1rem !important;
	font-size: 0.78rem;
	font-weight: 700;
}

.timeline-entry__detail {
	color: #728078;
	font-size: 0.65rem;
	text-align: right;
}

.timeline-entry__mood {
	z-index: 1;
	display: grid;
	width: 0.7rem;
	height: 0.7rem;
	place-items: center;
	overflow: visible;
	font-size: 0.8rem;
}

.mood-mark {
	color: #aac653;
	font-size: 0.6rem;
	letter-spacing: 0.13rem;
	white-space: nowrap;
}

.preview-art-note {
	position: absolute;
	right: 0.25rem;
	bottom: 0.55rem;
	margin: 0;
	color: #63766a;
	font-size: 0.75rem;
	font-weight: 600;
	transform: rotate(-4deg);
}

.preview-features {
	display: grid;
	gap: 2rem;
	margin-top: 5rem;
	padding: 2.25rem 0;
	border-top: 1px solid rgb(36 107 79 / 13%);
	border-bottom: 1px solid rgb(36 107 79 / 13%);
}

.preview-section-label {
	margin: 0;
	color: var(--preview-green);
	font-size: 0.8rem;
	font-weight: 700;
}

.preview-features__heading h2,
.preview-note h2 {
	max-width: 20ch;
	margin: 0.65rem 0 0;
	font-size: clamp(1.75rem, 4vw, 2.65rem);
	font-weight: 740;
	letter-spacing: -0.055em;
	line-height: 1.08;
}

.feature-list {
	display: grid;
	gap: 1.25rem;
}

.feature-row {
	display: grid;
	grid-template-columns: 2.8rem minmax(0, 1fr);
	align-items: start;
	gap: 0.9rem;
}

.feature-row__icon {
	display: grid;
	width: 2.65rem;
	height: 2.65rem;
	place-items: center;
	border-radius: 0.95rem;
	background: #e8f1e4;
	color: var(--preview-green);
}

.feature-row__copy h3,
.feature-row__copy p {
	margin: 0;
}

.feature-row__copy h3 {
	font-size: 0.95rem;
	font-weight: 750;
}

.feature-row__copy p {
	max-width: 36rem;
	margin-top: 0.3rem;
	color: #617167;
	font-size: 0.85rem;
	line-height: 1.6;
}

.preview-note {
	display: grid;
	align-items: center;
	gap: 1rem;
	margin-top: 3rem;
	padding: 1.5rem;
	border-radius: 1.5rem;
	background: var(--preview-green);
	color: white;
}

.preview-note__mark {
	align-self: start;
	color: var(--preview-lime);
	font-family: Georgia, serif;
	font-size: 4.5rem;
	line-height: 0.8;
}

.preview-note h2 {
	font-size: clamp(1.45rem, 3vw, 2rem);
}

.preview-note p {
	max-width: 44rem;
	margin: 0.55rem 0 0;
	color: rgb(255 255 255 / 78%);
	font-size: 0.9rem;
	line-height: 1.7;
}

.preview-note__link {
	display: inline-flex;
	min-height: 2.9rem;
	align-items: center;
	justify-content: center;
	padding: 0.7rem 1rem;
	border-radius: 0.9rem;
	background: var(--preview-lime);
	color: var(--preview-ink);
	font-size: 0.85rem;
	font-weight: 750;
	text-decoration: none;
	white-space: nowrap;
}

.preview-note__link:hover {
	background: #e0f88b;
}

@media (min-width: 768px) {
	.preview-hero {
		grid-template-columns: minmax(0, 0.96fr) minmax(22rem, 1fr);
		gap: 1rem;
	}

	.preview-features {
		grid-template-columns: minmax(15rem, 0.8fr) minmax(0, 1.2fr);
		gap: 3rem;
		padding: 2.75rem 1rem;
	}

	.preview-note {
		grid-template-columns: 3rem minmax(0, 1fr) auto;
		gap: 1.25rem;
		padding: 2rem 2.25rem;
	}
}

@media (max-width: 480px) {
	.preview-art {
		min-height: 25rem;
	}

	.day-card {
		width: 94%;
		padding: 1.1rem;
	}

	.timeline-entry {
		grid-template-columns: 0.7rem minmax(5rem, 1fr) auto;
		gap: 0.5rem;
	}

	.timeline-entry__detail {
		max-width: 7rem;
	}

	.preview-art-note {
		right: 0.4rem;
		bottom: 0;
	}
}

@media (prefers-reduced-motion: reduce) {
	.preview-primary,
	.preview-secondary {
		transition: none;
	}
}
</style>
