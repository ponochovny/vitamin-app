export const REACTION_NOTE_MAX_LENGTH = 400

export interface ReactionDraft {
	observedAt: string
	note: string
}

export type ReactionDraftResult =
	| { valid: true; observedAt: string; note: string | null }
	| { valid: false; reason: 'time-required' | 'time-invalid' | 'note-too-long' }

export function parseReactionDraft(draft: ReactionDraft): ReactionDraftResult {
	if (!draft.observedAt.trim()) {
		return { valid: false, reason: 'time-required' }
	}

	const date = new Date(draft.observedAt)
	if (Number.isNaN(date.getTime())) {
		return { valid: false, reason: 'time-invalid' }
	}

	const note = draft.note.trim()
	if (note.length > REACTION_NOTE_MAX_LENGTH) {
		return { valid: false, reason: 'note-too-long' }
	}

	return {
		valid: true,
		observedAt: date.toISOString(),
		note: note || null,
	}
}

export function toLocalDatetimeInput(date = new Date()) {
	const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
	return localDate.toISOString().slice(0, 16)
}
