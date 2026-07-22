import { ComponentFixture, TestBed } from '@angular/core/testing'
import { CarrisService } from '@core/services/carris.service'
import { carrisServiceMock } from '@core/testing/mocks'
import { of } from 'rxjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StopSearch } from './stop-search'

describe('StopSearch', () => {
	let fixture: ComponentFixture<StopSearch>
	let component: StopSearch

	beforeEach(() => {
		vi.clearAllMocks()

		TestBed.configureTestingModule({
			imports: [StopSearch],
			providers: [{ provide: CarrisService, useValue: carrisServiceMock }],
		})
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('does not search for an empty query', () => {
		fixture = TestBed.createComponent(StopSearch)
		component = fixture.componentInstance
		fixture.detectChanges()

		expect(carrisServiceMock.searchStops).not.toHaveBeenCalled()
		expect(component.stops()).toEqual([])
	})

	it('loads all stops for an empty query when showAllOnEmptyQuery is set', () => {
		vi.useFakeTimers()
		carrisServiceMock.searchStops.mockReturnValue(
			of([{ id: 'stop-1', name: 'Praça de Espanha', lat: 38.72, lon: -9.15 }]),
		)

		fixture = TestBed.createComponent(StopSearch)
		component = fixture.componentInstance
		fixture.componentRef.setInput('showAllOnEmptyQuery', true)
		fixture.detectChanges()
		vi.advanceTimersByTime(300)
		fixture.detectChanges()

		expect(carrisServiceMock.searchStops).toHaveBeenCalledWith('')
		expect(component.stops()).toEqual([
			{ id: 'stop-1', name: 'Praça de Espanha', lat: 38.72, lon: -9.15 },
		])
	})

	it('sorts stops alphabetically by name', () => {
		vi.useFakeTimers()
		carrisServiceMock.searchStops.mockReturnValue(
			of([
				{ id: 'stop-2', name: 'Sete Rios', lat: 38.74, lon: -9.16 },
				{ id: 'stop-1', name: 'Praça de Espanha', lat: 38.72, lon: -9.15 },
			]),
		)

		fixture = TestBed.createComponent(StopSearch)
		component = fixture.componentInstance
		fixture.detectChanges()

		component.onQueryChange('a')
		vi.advanceTimersByTime(300)
		fixture.detectChanges()

		expect(component.stops()).toEqual([
			{ id: 'stop-1', name: 'Praça de Espanha', lat: 38.72, lon: -9.15 },
			{ id: 'stop-2', name: 'Sete Rios', lat: 38.74, lon: -9.16 },
		])
	})

	it('searches stops once after the debounce window', () => {
		vi.useFakeTimers()
		carrisServiceMock.searchStops.mockReturnValue(
			of([{ id: 'stop-1', name: 'Praça de Espanha', lat: 38.72, lon: -9.15 }]),
		)

		fixture = TestBed.createComponent(StopSearch)
		component = fixture.componentInstance
		fixture.detectChanges()

		component.onQueryChange('Espanha')
		vi.advanceTimersByTime(300)
		fixture.detectChanges()

		expect(carrisServiceMock.searchStops).toHaveBeenCalledTimes(1)
		expect(carrisServiceMock.searchStops).toHaveBeenCalledWith('Espanha')
		expect(component.stops()).toEqual([
			{ id: 'stop-1', name: 'Praça de Espanha', lat: 38.72, lon: -9.15 },
		])
	})

	it('toggles the selected stop', () => {
		fixture = TestBed.createComponent(StopSearch)
		component = fixture.componentInstance
		fixture.detectChanges()

		component.toggleStop('stop-1')
		expect(component.selectedStopId()).toBe('stop-1')

		component.toggleStop('stop-1')
		expect(component.selectedStopId()).toBeNull()
	})
})
