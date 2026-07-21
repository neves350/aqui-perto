import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GeolocationService } from './geolocation.service'

describe('GeolocationService', () => {
	let service: GeolocationService
	let getCurrentPositionMock: ReturnType<typeof vi.fn>

	beforeEach(() => {
		service = new GeolocationService()
		getCurrentPositionMock = vi.fn()
		vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: getCurrentPositionMock } })
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('emits lat/lon when the browser grants permission', () => {
		getCurrentPositionMock.mockImplementation((success: PositionCallback) => {
			success({
				coords: { latitude: 38.7223, longitude: -9.1393 },
			} as GeolocationPosition)
		})

		const values: { lat: number; lon: number }[] = []
		let completed = false

		service.getCurrentPosition().subscribe({
			next: (value) => values.push(value),
			complete: () => (completed = true),
		})

		expect(values).toEqual([{ lat: 38.7223, lon: -9.1393 }])
		expect(completed).toBe(true)
	})

	it('errors when the browser denies permission', () => {
		getCurrentPositionMock.mockImplementation(
			(_success: PositionCallback, error: PositionErrorCallback) => {
				error({ code: 1, message: 'User denied Geolocation' } as GeolocationPositionError)
			},
		)

		let receivedError: unknown

		service.getCurrentPosition().subscribe({
			error: (err) => (receivedError = err),
		})

		expect(receivedError).toBeDefined()
	})
})
