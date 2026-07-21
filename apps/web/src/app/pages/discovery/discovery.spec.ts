import { ComponentFixture, TestBed } from '@angular/core/testing'
import { CarrisService } from '@core/services/carris.service'
import { GeolocationService } from '@core/services/geolocation.service'
import {
	carrisServiceMock,
	geolocationServiceMock,
} from '@core/testing/mocks'
import { of, throwError } from 'rxjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Discovery } from './discovery'

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

describe('Discovery', () => {
	let fixture: ComponentFixture<Discovery>
	let component: Discovery

	beforeEach(() => {
		vi.clearAllMocks()

		TestBed.configureTestingModule({
			imports: [Discovery],
			providers: [
				{ provide: CarrisService, useValue: carrisServiceMock },
				{ provide: GeolocationService, useValue: geolocationServiceMock },
			],
		})
	})

	it('loads nearby stops once geolocation resolves', () => {
		geolocationServiceMock.getCurrentPosition.mockReturnValue(
			of({ lat: 38.7223, lon: -9.1393 }),
		)
		carrisServiceMock.getStopsNearby.mockReturnValue(
			of([{ id: 'stop-1', name: 'Praça de Espanha', lat: 38.72, lon: -9.15 }]),
		)

		fixture = TestBed.createComponent(Discovery)
		component = fixture.componentInstance
		fixture.detectChanges()

		expect(carrisServiceMock.getStopsNearby).toHaveBeenCalledWith(
			38.7223,
			-9.1393,
		)
		expect(component.stops()).toEqual([
			{ id: 'stop-1', name: 'Praça de Espanha', lat: 38.72, lon: -9.15 },
		])
		expect(component.loading()).toBe(false)
	})

	it('shows a geolocation error state when permission is denied', () => {
		geolocationServiceMock.getCurrentPosition.mockReturnValue(
			throwError(() => new Error('denied')),
		)

		fixture = TestBed.createComponent(Discovery)
		component = fixture.componentInstance
		fixture.detectChanges()

		expect(component.geolocationError()).toBe(true)
		expect(component.loading()).toBe(false)
		expect(carrisServiceMock.getStopsNearby).not.toHaveBeenCalled()
	})

	it('lets the user pick a point on the map after a geolocation error', () => {
		geolocationServiceMock.getCurrentPosition.mockReturnValue(
			throwError(() => new Error('denied')),
		)
		carrisServiceMock.getStopsNearby.mockReturnValue(
			of([{ id: 'stop-1', name: 'Praça de Espanha', lat: 38.72, lon: -9.15 }]),
		)

		fixture = TestBed.createComponent(Discovery)
		component = fixture.componentInstance
		fixture.detectChanges()

		component.onMapClick({ lat: 38.7, lon: -9.14 })

		expect(component.geolocationError()).toBe(false)
		expect(carrisServiceMock.getStopsNearby).toHaveBeenCalledWith(38.7, -9.14)
		expect(component.stops()).toEqual([
			{ id: 'stop-1', name: 'Praça de Espanha', lat: 38.72, lon: -9.15 },
		])
	})

	it('selects a stop, delegating arrivals loading to StopArrivalsList', () => {
		geolocationServiceMock.getCurrentPosition.mockReturnValue(
			of({ lat: 38.7223, lon: -9.1393 }),
		)
		carrisServiceMock.getStopsNearby.mockReturnValue(
			of([{ id: 'stop-1', name: 'Praça de Espanha', lat: 38.72, lon: -9.15 }]),
		)
		carrisServiceMock.getArrivals.mockReturnValue(of([]))

		fixture = TestBed.createComponent(Discovery)
		component = fixture.componentInstance
		fixture.detectChanges()

		component.selectStop('stop-1')
		fixture.detectChanges()

		expect(component.selectedStopId()).toBe('stop-1')
		expect(carrisServiceMock.getArrivals).toHaveBeenCalledWith('stop-1')
	})
})
