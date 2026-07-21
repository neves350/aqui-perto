import { vi } from 'vitest'

export const mapInstance = {
	on: vi.fn(),
	setCenter: vi.fn(),
	remove: vi.fn(),
}

export const markerInstance = {
	setLngLat: vi.fn().mockReturnThis(),
	addTo: vi.fn().mockReturnThis(),
	remove: vi.fn(),
}

export const carrisServiceMock = {
	getStopsNearby: vi.fn(),
	getStopById: vi.fn(),
	searchLines: vi.fn(),
	getLineById: vi.fn(),
	getArrivals: vi.fn(),
}

export const geolocationServiceMock = {
	getCurrentPosition: vi.fn(),
}
