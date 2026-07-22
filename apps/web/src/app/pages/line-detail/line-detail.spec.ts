import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { CarrisService } from '@core/services/carris.service'
import { carrisServiceMock } from '@core/testing/mocks'
import { of, throwError } from 'rxjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LineDetail } from './line-detail'

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

const { Map: MockMap } = await import('maplibre-gl')

const LINE_ROUTE = {
	id: '4200_0',
	shortName: '758',
	longName: 'Alameda - Odivelas',
	color: '#FF0000',
	textColor: '#FFFFFF',
	stops: [
		{
			stopId: 'stopA',
			name: 'Alameda',
			sequence: 1,
			lat: 38.736,
			lon: -9.136,
			minutesUntilArrival: 5,
			scheduledArrival: '10:05',
		},
		{
			stopId: 'stopB',
			name: 'Odivelas',
			sequence: 2,
			lat: 38.791,
			lon: -9.183,
			minutesUntilArrival: null,
			scheduledArrival: null,
		},
	],
}

describe('LineDetail', () => {
	let fixture: ComponentFixture<LineDetail>
	let component: LineDetail

	beforeEach(() => {
		vi.clearAllMocks()

		TestBed.configureTestingModule({
			imports: [LineDetail],
			providers: [
				{ provide: CarrisService, useValue: carrisServiceMock },
				provideRouter([]),
			],
		})
	})

	it('shows a loading state before the route arrives', () => {
		carrisServiceMock.getLineRoute.mockReturnValue(of(LINE_ROUTE))

		fixture = TestBed.createComponent(LineDetail)
		component = fixture.componentInstance
		fixture.componentRef.setInput('id', '4200_0')

		expect(component.loading()).toBe(true)
		expect(component.route()).toBeNull()
	})

	it('loads the route for the given id and exposes it once resolved', () => {
		carrisServiceMock.getLineRoute.mockReturnValue(of(LINE_ROUTE))

		fixture = TestBed.createComponent(LineDetail)
		component = fixture.componentInstance
		fixture.componentRef.setInput('id', '4200_0')
		fixture.detectChanges()

		expect(carrisServiceMock.getLineRoute).toHaveBeenCalledWith('4200_0')
		expect(component.loading()).toBe(false)
		expect(component.route()).toEqual(LINE_ROUTE)
	})

	it('shows an error state when the route fails to load', () => {
		carrisServiceMock.getLineRoute.mockReturnValue(
			throwError(() => new Error('not found')),
		)

		fixture = TestBed.createComponent(LineDetail)
		component = fixture.componentInstance
		fixture.componentRef.setInput('id', 'missing')
		fixture.detectChanges()

		expect(component.loading()).toBe(false)
		expect(component.route()).toBeNull()
	})

	it('passes the ordered stop coordinates to the map as the route and centers on the first stop', () => {
		carrisServiceMock.getLineRoute.mockReturnValue(of(LINE_ROUTE))

		fixture = TestBed.createComponent(LineDetail)
		component = fixture.componentInstance
		fixture.componentRef.setInput('id', '4200_0')
		fixture.detectChanges()

		expect(component.mapRoute()).toEqual([
			{ lat: 38.736, lon: -9.136 },
			{ lat: 38.791, lon: -9.183 },
		])
		expect(MockMap).toHaveBeenCalledWith(
			expect.objectContaining({ center: [-9.136, 38.736] }),
		)
	})
})
