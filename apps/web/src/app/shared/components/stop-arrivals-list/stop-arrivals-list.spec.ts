import { ComponentFixture, TestBed } from '@angular/core/testing'
import { CarrisService } from '@core/services/carris.service'
import { carrisServiceMock } from '@core/testing/mocks'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StopArrivalsList } from './stop-arrivals-list'

describe('StopArrivalsList', () => {
	let fixture: ComponentFixture<StopArrivalsList>
	let component: StopArrivalsList

	beforeEach(() => {
		vi.clearAllMocks()

		TestBed.configureTestingModule({
			imports: [StopArrivalsList],
			providers: [{ provide: CarrisService, useValue: carrisServiceMock }],
		})
	})

	it('loads and exposes arrivals for the given stop', () => {
		carrisServiceMock.getArrivals.mockReturnValue(
			of([
				{
					tripId: 'trip-1',
					lineId: '4200_0',
					lineName: '758 Odivelas',
					arrivalTime: '09:05',
					type: 'scheduled',
				},
			]),
		)

		fixture = TestBed.createComponent(StopArrivalsList)
		component = fixture.componentInstance
		fixture.componentRef.setInput('stopId', 'stop-1')
		fixture.detectChanges()

		expect(carrisServiceMock.getArrivals).toHaveBeenCalledWith('stop-1')
		expect(component.arrivals()).toEqual([
			{
				tripId: 'trip-1',
				lineId: '4200_0',
				lineName: '758 Odivelas',
				arrivalTime: '09:05',
				type: 'scheduled',
			},
		])
		expect(component.loading()).toBe(false)
	})

	it('reloads arrivals when stopId changes', () => {
		carrisServiceMock.getArrivals.mockReturnValueOnce(
			of([
				{
					tripId: 'trip-1',
					lineId: '4200_0',
					lineName: '758 Odivelas',
					arrivalTime: '09:05',
					type: 'scheduled',
				},
			]),
		)

		fixture = TestBed.createComponent(StopArrivalsList)
		component = fixture.componentInstance
		fixture.componentRef.setInput('stopId', 'stop-1')
		fixture.detectChanges()

		carrisServiceMock.getArrivals.mockReturnValueOnce(
			of([
				{
					tripId: 'trip-2',
					lineId: '4300_0',
					lineName: '759 Loures',
					arrivalTime: '09:10',
					type: 'scheduled',
				},
			]),
		)

		fixture.componentRef.setInput('stopId', 'stop-2')
		fixture.detectChanges()

		expect(carrisServiceMock.getArrivals).toHaveBeenCalledWith('stop-2')
		expect(component.arrivals()).toEqual([
			{
				tripId: 'trip-2',
				lineId: '4300_0',
				lineName: '759 Loures',
				arrivalTime: '09:10',
				type: 'scheduled',
			},
		])
	})
})
