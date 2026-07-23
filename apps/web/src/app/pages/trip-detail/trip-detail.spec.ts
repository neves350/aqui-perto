import { ComponentFixture, TestBed } from '@angular/core/testing'
import { CarrisService } from '@core/services/carris.service'
import { carrisServiceMock } from '@core/testing/mocks'
import { of, Subject } from 'rxjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LineRoute } from '@/shared/models/line-route.model'
import { PathResult } from '@/shared/models/path.model'
import { TripDetail } from './trip-detail'

const DIRECT_RESULT: PathResult = {
	found: true,
	legs: [
		{
			lineId: '4200_0',
			lineName: '758',
			originStopId: '070001',
			destinationStopId: '070004',
			departureTime: '08:00',
			arrivalTime: '08:30',
		},
	],
	totalTimeMinutes: 30,
	estimatedFare: 1.3,
}

const NOT_FOUND_RESULT: PathResult = {
	found: false,
	reason: 'no-0-1-transfer-combination',
}

const LINE_ROUTE: LineRoute = {
	id: '4200_0',
	shortName: '758',
	longName: 'Alameda - Odivelas',
	color: '#FF0000',
	textColor: '#FFFFFF',
	directionId: 0,
	headsign: 'Odivelas',
	directions: [{ directionId: 0, headsign: 'Odivelas' }],
	stops: [
		{
			stopId: '070001',
			name: 'Alameda',
			sequence: 1,
			lat: 0,
			lon: 0,
			minutesUntilArrival: null,
			scheduledArrival: '08:00',
		},
		{
			stopId: '070002',
			name: 'Chelas',
			sequence: 2,
			lat: 0,
			lon: 0,
			minutesUntilArrival: null,
			scheduledArrival: '08:10',
		},
		{
			stopId: '070003',
			name: 'Marvila',
			sequence: 3,
			lat: 0,
			lon: 0,
			minutesUntilArrival: null,
			scheduledArrival: '08:20',
		},
		{
			stopId: '070004',
			name: 'Odivelas',
			sequence: 4,
			lat: 0,
			lon: 0,
			minutesUntilArrival: null,
			scheduledArrival: '08:30',
		},
	],
	shape: [],
}

describe('TripDetail', () => {
	let fixture: ComponentFixture<TripDetail>
	let component: TripDetail

	beforeEach(() => {
		vi.clearAllMocks()

		TestBed.configureTestingModule({
			imports: [TripDetail],
			providers: [{ provide: CarrisService, useValue: carrisServiceMock }],
		})

		fixture = TestBed.createComponent(TripDetail)
		component = fixture.componentInstance
	})

	it('requests the path with the origin, destination and departure time from the route', () => {
		carrisServiceMock.getPath.mockReturnValue(of(DIRECT_RESULT))
		carrisServiceMock.getLineRoute.mockReturnValue(of(LINE_ROUTE))

		fixture.componentRef.setInput('originStopId', '070001')
		fixture.componentRef.setInput('destinationStopId', '070004')
		fixture.componentRef.setInput('departureTime', '2026-07-23T08:00')
		fixture.detectChanges()

		expect(carrisServiceMock.getPath).toHaveBeenCalledWith({
			originStopId: '070001',
			destinationStopId: '070004',
			departureTime: '2026-07-23T08:00',
		})
	})

	it('shows a loading state before the trip resolves', () => {
		const results = new Subject<PathResult>()
		carrisServiceMock.getPath.mockReturnValue(results)
		carrisServiceMock.getLineRoute.mockReturnValue(of(LINE_ROUTE))

		fixture.componentRef.setInput('originStopId', '070001')
		fixture.componentRef.setInput('destinationStopId', '070004')
		fixture.detectChanges()

		expect(component.loading()).toBe(true)

		results.next(DIRECT_RESULT)
		expect(component.loading()).toBe(false)
	})

	it('exposes total time and estimated fare once resolved', () => {
		carrisServiceMock.getPath.mockReturnValue(of(DIRECT_RESULT))
		carrisServiceMock.getLineRoute.mockReturnValue(of(LINE_ROUTE))

		fixture.componentRef.setInput('originStopId', '070001')
		fixture.componentRef.setInput('destinationStopId', '070004')
		fixture.detectChanges()

		expect(component.result()).toEqual(DIRECT_RESULT)
		expect(fixture.nativeElement.textContent).toContain('30')
		expect(fixture.nativeElement.textContent).toContain('1,3')
	})

	it('shows a clear message when no trip was found', () => {
		carrisServiceMock.getPath.mockReturnValue(of(NOT_FOUND_RESULT))

		fixture.componentRef.setInput('originStopId', '070001')
		fixture.componentRef.setInput('destinationStopId', '070004')
		fixture.detectChanges()

		expect(fixture.nativeElement.textContent).toContain(
			'ão encontrámos um trajeto',
		)
	})

	it('shows the duration of each leg', () => {
		carrisServiceMock.getPath.mockReturnValue(of(DIRECT_RESULT))
		carrisServiceMock.getLineRoute.mockReturnValue(of(LINE_ROUTE))

		fixture.componentRef.setInput('originStopId', '070001')
		fixture.componentRef.setInput('destinationStopId', '070004')
		fixture.detectChanges()

		const legHeading = fixture.nativeElement.querySelector('li h2')
		expect(legHeading.textContent).toContain('30 min')
	})

	it('resolves the intermediate stops of each leg from the line route', () => {
		carrisServiceMock.getPath.mockReturnValue(of(DIRECT_RESULT))
		carrisServiceMock.getLineRoute.mockReturnValue(of(LINE_ROUTE))

		fixture.componentRef.setInput('originStopId', '070001')
		fixture.componentRef.setInput('destinationStopId', '070004')
		fixture.detectChanges()

		expect(carrisServiceMock.getLineRoute).toHaveBeenCalledWith('4200_0')
		expect(component.legDetails()).toEqual([
			{
				leg: DIRECT_RESULT.legs?.[0],
				durationMinutes: 30,
				intermediateStops: LINE_ROUTE.stops,
			},
		])
	})

	it('shows placeholders for occupancy and live map data by default', () => {
		carrisServiceMock.getPath.mockReturnValue(of(DIRECT_RESULT))
		carrisServiceMock.getLineRoute.mockReturnValue(of(LINE_ROUTE))

		fixture.componentRef.setInput('originStopId', '070001')
		fixture.componentRef.setInput('destinationStopId', '070004')
		fixture.detectChanges()

		expect(fixture.nativeElement.textContent).toContain('isponível brevemente')
	})
})
