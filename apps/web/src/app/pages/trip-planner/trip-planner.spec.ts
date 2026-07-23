import { ComponentFixture, TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import { provideRouter } from '@angular/router'
import { CarrisService } from '@core/services/carris.service'
import { carrisServiceMock } from '@core/testing/mocks'
import { of, Subject, throwError } from 'rxjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StopSearch } from '@/shared/components/search/stop-search/stop-search'
import { PathResult } from '@/shared/models/path.model'
import { TripPlanner } from './trip-planner'
import { TripResult } from './trip-result/trip-result'

const ORIGIN = {
	id: '070001',
	name: 'Praça de Espanha',
	lat: 38.72,
	lon: -9.15,
}
const DESTINATION = { id: '070002', name: 'Sete Rios', lat: 38.74, lon: -9.16 }

const FOUND_RESULT: PathResult = {
	found: true,
	results: [
		{
			legs: [
				{
					lineId: '4200_0',
					lineName: '758',
					originStopId: ORIGIN.id,
					destinationStopId: DESTINATION.id,
					departureTime: '08:00',
					arrivalTime: '08:20',
				},
			],
			totalTimeMinutes: 20,
			estimatedFare: 1.3,
		},
	],
}

const MULTI_RESULT: PathResult = {
	found: true,
	results: [
		{
			legs: [
				{
					lineId: '4200_0',
					lineName: '758',
					originStopId: ORIGIN.id,
					destinationStopId: DESTINATION.id,
					departureTime: '08:00',
					arrivalTime: '08:20',
				},
			],
			totalTimeMinutes: 20,
			estimatedFare: 1.3,
		},
		{
			legs: [
				{
					lineId: '4300_0',
					lineName: '112',
					originStopId: ORIGIN.id,
					destinationStopId: DESTINATION.id,
					departureTime: '08:05',
					arrivalTime: '08:30',
				},
			],
			totalTimeMinutes: 25,
			estimatedFare: 1.55,
		},
		{
			legs: [
				{
					lineId: '4400_0',
					lineName: '113',
					originStopId: ORIGIN.id,
					destinationStopId: DESTINATION.id,
					departureTime: '08:10',
					arrivalTime: '08:40',
				},
			],
			totalTimeMinutes: 30,
			estimatedFare: 1.55,
		},
	],
}

const NOT_FOUND_RESULT: PathResult = {
	found: false,
	reason: 'no-path-found',
}

describe('TripPlanner', () => {
	let fixture: ComponentFixture<TripPlanner>
	let component: TripPlanner

	beforeEach(() => {
		vi.clearAllMocks()

		TestBed.configureTestingModule({
			imports: [TripPlanner],
			providers: [
				{ provide: CarrisService, useValue: carrisServiceMock },
				provideRouter([]),
			],
		})

		fixture = TestBed.createComponent(TripPlanner)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('shows a stop picker for origin and destination when nothing is selected yet', () => {
		const pickers = fixture.debugElement.queryAll(By.directive(StopSearch))
		expect(pickers.length).toBe(2)
	})

	it('disables submission until both origin and destination are selected', () => {
		expect(component.canSubmit()).toBe(false)

		component.onOriginSelected(ORIGIN)
		expect(component.canSubmit()).toBe(false)

		component.onDestinationSelected(DESTINATION)
		expect(component.canSubmit()).toBe(true)
	})

	it('does not allow submission when origin and destination are the same stop', () => {
		component.onOriginSelected(ORIGIN)
		component.onDestinationSelected(ORIGIN)

		expect(component.canSubmit()).toBe(false)
	})

	it('replaces the origin picker with the chosen stop, and can be cleared again', () => {
		component.onOriginSelected(ORIGIN)
		fixture.detectChanges()

		expect(fixture.debugElement.queryAll(By.directive(StopSearch)).length).toBe(
			1,
		)
		expect(fixture.nativeElement.textContent).toContain(ORIGIN.name)

		component.clearOrigin()
		fixture.detectChanges()

		expect(fixture.debugElement.queryAll(By.directive(StopSearch)).length).toBe(
			2,
		)
	})

	it('calls getPath with the selected origin and destination on submit', () => {
		carrisServiceMock.getPath.mockReturnValue(of(FOUND_RESULT))

		component.onOriginSelected(ORIGIN)
		component.onDestinationSelected(DESTINATION)
		component.onSubmit()

		expect(carrisServiceMock.getPath).toHaveBeenCalledWith({
			originStopId: ORIGIN.id,
			destinationStopId: DESTINATION.id,
		})
	})

	it('includes departureTime in the query when set', () => {
		carrisServiceMock.getPath.mockReturnValue(of(FOUND_RESULT))

		component.onOriginSelected(ORIGIN)
		component.onDestinationSelected(DESTINATION)
		component.onDepartureTimeChange('2026-07-23T08:00')
		component.onSubmit()

		expect(carrisServiceMock.getPath).toHaveBeenCalledWith({
			originStopId: ORIGIN.id,
			destinationStopId: DESTINATION.id,
			departureTime: '2026-07-23T08:00',
		})
	})

	it('does not submit when origin or destination are missing', () => {
		component.onOriginSelected(ORIGIN)
		component.onSubmit()

		expect(carrisServiceMock.getPath).not.toHaveBeenCalled()
	})

	it('shows a loading state while the trip is being calculated', () => {
		const results = new Subject<PathResult>()
		carrisServiceMock.getPath.mockReturnValue(results)

		component.onOriginSelected(ORIGIN)
		component.onDestinationSelected(DESTINATION)
		component.onSubmit()

		expect(component.loading()).toBe(true)

		results.next(FOUND_RESULT)
		expect(component.loading()).toBe(false)
	})

	it('exposes the result once the trip is found', () => {
		carrisServiceMock.getPath.mockReturnValue(of(FOUND_RESULT))

		component.onOriginSelected(ORIGIN)
		component.onDestinationSelected(DESTINATION)
		component.onSubmit()

		expect(component.result()).toEqual(FOUND_RESULT)
	})

	it('lists every option returned by the API', () => {
		carrisServiceMock.getPath.mockReturnValue(of(MULTI_RESULT))

		component.onOriginSelected(ORIGIN)
		component.onDestinationSelected(DESTINATION)
		component.onSubmit()
		fixture.detectChanges()

		const options = fixture.debugElement.queryAll(By.directive(TripResult))
		expect(options.length).toBe(3)
	})

	it('shows a clear message when no trip is found', () => {
		carrisServiceMock.getPath.mockReturnValue(of(NOT_FOUND_RESULT))

		component.onOriginSelected(ORIGIN)
		component.onDestinationSelected(DESTINATION)
		component.onSubmit()
		fixture.detectChanges()

		expect(fixture.nativeElement.textContent).toContain(
			'Não encontrámos nenhum trajeto',
		)
	})

	it('recovers to a non-loading state when the request fails', () => {
		carrisServiceMock.getPath.mockReturnValue(
			throwError(() => new Error('network error')),
		)

		component.onOriginSelected(ORIGIN)
		component.onDestinationSelected(DESTINATION)
		component.onSubmit()

		expect(component.loading()).toBe(false)
		expect(component.result()).toBeNull()
	})
})
