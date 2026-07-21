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
