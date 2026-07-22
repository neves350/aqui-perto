import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeService } from './theme.service'

function stubMatchMedia(matches: boolean) {
	vi.stubGlobal(
		'matchMedia',
		vi.fn().mockReturnValue({ matches }) as unknown as typeof window.matchMedia,
	)
}

describe('ThemeService', () => {
	beforeEach(() => {
		localStorage.clear()
		document.documentElement.classList.remove('dark')
		TestBed.configureTestingModule({})
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('defaults to the system preference when nothing is stored', () => {
		stubMatchMedia(true)

		const service = TestBed.inject(ThemeService)
		TestBed.tick()

		expect(service.theme()).toBe('dark')
		expect(document.documentElement.classList.contains('dark')).toBe(true)
	})

	it('falls back to light when the system has no dark preference', () => {
		stubMatchMedia(false)

		const service = TestBed.inject(ThemeService)
		TestBed.tick()

		expect(service.theme()).toBe('light')
		expect(document.documentElement.classList.contains('dark')).toBe(false)
	})

	it('restores the previously stored theme, ignoring system preference', () => {
		localStorage.setItem('theme', 'dark')
		stubMatchMedia(false)

		const service = TestBed.inject(ThemeService)

		expect(service.theme()).toBe('dark')
	})

	it('toggles between light and dark, syncing the DOM and localStorage', () => {
		stubMatchMedia(false)
		const service = TestBed.inject(ThemeService)

		service.toggle()
		TestBed.tick()

		expect(service.theme()).toBe('dark')
		expect(document.documentElement.classList.contains('dark')).toBe(true)
		expect(localStorage.getItem('theme')).toBe('dark')

		service.toggle()
		TestBed.tick()

		expect(service.theme()).toBe('light')
		expect(document.documentElement.classList.contains('dark')).toBe(false)
		expect(localStorage.getItem('theme')).toBe('light')
	})
})
