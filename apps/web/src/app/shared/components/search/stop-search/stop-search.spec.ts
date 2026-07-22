import { ComponentFixture, TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import { CarrisService } from '@core/services/carris.service'
import { carrisServiceMock } from '@core/testing/mocks'
import { of, Subject } from 'rxjs'
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

	it('exposes loading while the search is in flight, then false once it resolves', () => {
		vi.useFakeTimers()
		const results = new Subject<
			{ id: string; name: string; lat: number; lon: number }[]
		>()
		carrisServiceMock.searchStops.mockReturnValue(results)

		fixture = TestBed.createComponent(StopSearch)
		component = fixture.componentInstance
		fixture.detectChanges()

		component.onQueryChange('Espanha')
		vi.advanceTimersByTime(300)
		fixture.detectChanges()

		expect(component.loading()).toBe(true)
		expect(component.stops()).toEqual([])

		results.next([
			{ id: 'stop-1', name: 'Praça de Espanha', lat: 38.72, lon: -9.15 },
		])
		fixture.detectChanges()

		expect(component.loading()).toBe(false)
	})

	it('renders skeleton placeholders while loading, and the results once resolved', () => {
		vi.useFakeTimers()
		const results = new Subject<
			{ id: string; name: string; lat: number; lon: number }[]
		>()
		carrisServiceMock.searchStops.mockReturnValue(results)

		fixture = TestBed.createComponent(StopSearch)
		fixture.detectChanges()

		fixture.componentInstance.onQueryChange('Espanha')
		vi.advanceTimersByTime(300)
		fixture.detectChanges()

		expect(
			fixture.debugElement.queryAll(By.css('[hlmSkeleton]')).length,
		).toBeGreaterThan(0)

		results.next([
			{ id: 'stop-1', name: 'Praça de Espanha', lat: 38.72, lon: -9.15 },
		])
		fixture.detectChanges()

		expect(fixture.debugElement.queryAll(By.css('[hlmSkeleton]'))).toHaveLength(
			0,
		)
		expect(
			fixture.debugElement.query(By.css('button')).nativeElement.textContent,
		).toContain('Praça de Espanha')
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
