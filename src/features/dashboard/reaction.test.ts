import { describe, expect, it } from 'vitest'
import {
	REACTION_NOTE_MAX_LENGTH,
	parseReactionDraft,
	toLocalDatetimeInput,
} from './reaction'

describe('parseReactionDraft', () => {
	it('requires an observed time', () => {
		expect(parseReactionDraft({ observedAt: '', note: '' })).toEqual({
			valid: false,
			reason: 'time-required',
		})
	})

	it('returns a trimmed optional note and ISO time', () => {
		const result = parseReactionDraft({
			observedAt: '2026-11-25T18:30',
			note: ' Нудота через годину ',
		})
		expect(result.valid).toBe(true)
		if (!result.valid) return
		expect(result.note).toBe('Нудота через годину')
		expect(result.observedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
	})

	it('allows an observation without a note', () => {
		const result = parseReactionDraft({
			observedAt: '2026-11-25T18:30',
			note: ' ',
		})
		expect(result.valid).toBe(true)
		if (result.valid) expect(result.note).toBeNull()
	})

	it('rejects notes over the limit', () => {
		expect(
			parseReactionDraft({
				observedAt: '2026-11-25T18:30',
				note: 'а'.repeat(REACTION_NOTE_MAX_LENGTH + 1),
			}),
		).toEqual({ valid: false, reason: 'note-too-long' })
	})

	it('creates a datetime-local value', () => {
		expect(toLocalDatetimeInput(new Date('2026-11-25T18:30:00Z'))).toMatch(
			/^2026-11-25T/,
		)
	})
})
