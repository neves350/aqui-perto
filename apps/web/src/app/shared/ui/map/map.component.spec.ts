import { TestBed } from '@angular/core/testing'
import { mapInstance, markerInstance } from '@core/testing/mocks'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MapComponent } from './map.component'

vi.mock('maplibre-gl', async () => {
	const { mapInstance, markerInstance } = await import('@core/testing/mocks')
	return {
		Map: vi.fn().mockImplementation(function MockMap() {
			return mapInstance
		}),
		Marker: vi.fn().mockImplementation(function MockMarker() {
			return markerInstance
		}),
	}
})

const { Map: MockMap, Marker: MockMarker } = await import('maplibre-gl')

describe('MapComponent', () => {
	beforeEach(() => {
		vi.clearAllMocks()

		TestBed.configureTestingModule({
			imports: [MapComponent],
		})
	})

	it('creates a map centered on the given center', () => {
		const fixture = TestBed.createComponent(MapComponent)
		fixture.componentRef.setInput('center', { lat: 38.7223, lon: -9.1393 })
		fixture.detectChanges()

		expect(MockMap).toHaveBeenCalledWith(
			expect.objectContaining({ center: [-9.1393, 38.7223] }),
		)
	})

	it('renders one marker per entry in markers', () => {
		const fixture = TestBed.createComponent(MapComponent)
		fixture.componentRef.setInput('center', { lat: 38.7223, lon: -9.1393 })
		fixture.componentRef.setInput('markers', [
			{ id: 'a', lat: 38.72, lon: -9.14 },
			{ id: 'b', lat: 38.73, lon: -9.15 },
		])
		fixture.detectChanges()

		expect(MockMarker).toHaveBeenCalledTimes(2)
		expect(markerInstance.setLngLat).toHaveBeenCalledWith([-9.14, 38.72])
		expect(markerInstance.setLngLat).toHaveBeenCalledWith([-9.15, 38.73])
	})

	it('renders a marker for the user position when provided', () => {
		const fixture = TestBed.createComponent(MapComponent)
		fixture.componentRef.setInput('center', { lat: 38.7223, lon: -9.1393 })
		fixture.componentRef.setInput('userPosition', { lat: 38.72, lon: -9.14 })
		fixture.detectChanges()

		expect(MockMarker).toHaveBeenCalledWith(
			expect.objectContaining({ color: expect.any(String) }),
		)
		expect(markerInstance.setLngLat).toHaveBeenCalledWith([-9.14, 38.72])
	})

	it('removes the user marker when userPosition becomes null', () => {
		const fixture = TestBed.createComponent(MapComponent)
		fixture.componentRef.setInput('center', { lat: 38.7223, lon: -9.1393 })
		fixture.componentRef.setInput('userPosition', { lat: 38.72, lon: -9.14 })
		fixture.detectChanges()

		fixture.componentRef.setInput('userPosition', null)
		fixture.detectChanges()

		expect(markerInstance.remove).toHaveBeenCalled()
	})

	it('emits mapClick with lat/lon when the map is clicked', () => {
		const fixture = TestBed.createComponent(MapComponent)
		fixture.componentRef.setInput('center', { lat: 38.7223, lon: -9.1393 })
		fixture.detectChanges()

		const clicks: { lat: number; lon: number }[] = []
		fixture.componentInstance.mapClick.subscribe((value) => clicks.push(value))

		const clickHandler = mapInstance.on.mock.calls.find(
			([event]) => event === 'click',
		)?.[1]
		clickHandler({ lngLat: { lat: 38.71, lng: -9.12 } })

		expect(clicks).toEqual([{ lat: 38.71, lon: -9.12 }])
	})
})
