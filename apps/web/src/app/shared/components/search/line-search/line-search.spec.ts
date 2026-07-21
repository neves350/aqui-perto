import { ComponentFixture, TestBed } from '@angular/core/testing'
import { CarrisService } from '@core/services/carris.service'
import { carrisServiceMock } from '@core/testing/mocks'
import { of } from 'rxjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LineSearch } from './line-search'

describe('LineSearch', () => {
	let fixture: ComponentFixture<LineSearch>
	let component: LineSearch

	beforeEach(() => {
		vi.clearAllMocks()

		TestBed.configureTestingModule({
			imports: [LineSearch],
			providers: [{ provide: CarrisService, useValue: carrisServiceMock }],
		})
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('does not search for an empty query', () => {
		fixture = TestBed.createComponent(LineSearch)
		component = fixture.componentInstance
		fixture.detectChanges()

		expect(carrisServiceMock.searchLines).not.toHaveBeenCalled()
		expect(component.lines()).toEqual([])
	})

	it('searches lines once after the debounce window', () => {
		vi.useFakeTimers()
		carrisServiceMock.searchLines.mockReturnValue(
			of([
				{
					id: '4200_0',
					shortName: '758',
					longName: 'Alameda - Odivelas',
					color: '#FF0000',
					textColor: '#FFFFFF',
				},
			]),
		)

		fixture = TestBed.createComponent(LineSearch)
		component = fixture.componentInstance
		fixture.detectChanges()

		component.onQueryChange('758')
		vi.advanceTimersByTime(300)
		fixture.detectChanges()

		expect(carrisServiceMock.searchLines).toHaveBeenCalledTimes(1)
		expect(carrisServiceMock.searchLines).toHaveBeenCalledWith('758')
		expect(component.lines()).toEqual([
			{
				id: '4200_0',
				shortName: '758',
				longName: 'Alameda - Odivelas',
				color: '#FF0000',
				textColor: '#FFFFFF',
			},
		])
	})

	it('toggles the selected line', () => {
		fixture = TestBed.createComponent(LineSearch)
		component = fixture.componentInstance
		fixture.detectChanges()

		component.toggleLine('4200_0')
		expect(component.selectedLineId()).toBe('4200_0')

		component.toggleLine('4200_0')
		expect(component.selectedLineId()).toBeNull()
	})
})
