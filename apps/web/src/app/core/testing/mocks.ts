import { vi } from 'vitest'

export const routeSourceInstance = {
	setData: vi.fn(),
}

export const mapInstance = {
	on: vi.fn(),
	setCenter: vi.fn(),
	remove: vi.fn(),
	addSource: vi.fn(),
	addLayer: vi.fn(),
	getSource: vi.fn().mockReturnValue(routeSourceInstance),
	fitBounds: vi.fn(),
}

export const markerInstance = {
	setLngLat: vi.fn().mockReturnThis(),
	addTo: vi.fn().mockReturnThis(),
	remove: vi.fn(),
}

export const carrisServiceMock = {
	getStopsNearby: vi.fn(),
	getStopById: vi.fn(),
	searchStops: vi.fn(),
	searchLines: vi.fn(),
	getLineRoute: vi.fn(),
	getLineById: vi.fn(),
	getArrivals: vi.fn(),
	getPath: vi.fn(),
}

export const geolocationServiceMock = {
	getCurrentPosition: vi.fn(),
}
