import { ComponentFixture, TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import { provideRouter } from '@angular/router'
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
			providers: [
				{ provide: CarrisService, useValue: carrisServiceMock },
				provideRouter([]),
			],
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

	it('shows a link to the full route when a result is expanded', () => {
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

		component.toggleLine('4200_0')
		fixture.detectChanges()

		const link = fixture.debugElement.query(By.css('a[href="/lines/4200_0"]'))
		expect(link).not.toBeNull()
		expect(link.nativeElement.textContent).toContain('Ver percurso completo')
	})

	it('groups results by color, sorted ascending by shortName within each group, and orders groups by their lowest shortName', () => {
		vi.useFakeTimers()
		carrisServiceMock.searchLines.mockReturnValue(
			of([
				{
					id: 'red-20',
					shortName: '4520',
					longName: 'Red twenty',
					color: '#FF0000',
					textColor: '#FFFFFF',
				},
				{
					id: 'blue-10',
					shortName: '758',
					longName: 'Blue ten',
					color: '#0000FF',
					textColor: '#FFFFFF',
				},
				{
					id: 'red-10',
					shortName: '3001',
					longName: 'Red ten',
					color: '#FF0000',
					textColor: '#FFFFFF',
				},
				{
					id: 'blue-20',
					shortName: '1250',
					longName: 'Blue twenty',
					color: '#0000FF',
					textColor: '#FFFFFF',
				},
			]),
		)

		fixture = TestBed.createComponent(LineSearch)
		component = fixture.componentInstance
		fixture.detectChanges()

		component.onQueryChange('a')
		vi.advanceTimersByTime(300)
		fixture.detectChanges()

		expect(component.groupedLines()).toEqual([
			{
				color: '#0000FF',
				lines: [
					{
						id: 'blue-10',
						shortName: '758',
						longName: 'Blue ten',
						color: '#0000FF',
						textColor: '#FFFFFF',
					},
					{
						id: 'blue-20',
						shortName: '1250',
						longName: 'Blue twenty',
						color: '#0000FF',
						textColor: '#FFFFFF',
					},
				],
			},
			{
				color: '#FF0000',
				lines: [
					{
						id: 'red-10',
						shortName: '3001',
						longName: 'Red ten',
						color: '#FF0000',
						textColor: '#FFFFFF',
					},
					{
						id: 'red-20',
						shortName: '4520',
						longName: 'Red twenty',
						color: '#FF0000',
						textColor: '#FFFFFF',
					},
				],
			},
		])
	})
})
