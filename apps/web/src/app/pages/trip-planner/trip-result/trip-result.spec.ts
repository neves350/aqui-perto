import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { beforeEach, describe, expect, it } from 'vitest'
import { PathOption } from '@/shared/models/path.model'
import { TripResult } from './trip-result'

const DIRECT_OPTION: PathOption = {
	legs: [
		{
			lineId: '4200_0',
			lineName: '758',
			originStopId: '070001',
			destinationStopId: '070002',
			departureTime: '08:00',
			arrivalTime: '08:20',
		},
	],
	totalTimeMinutes: 20,
	estimatedFare: 1.3,
}

const TRANSFER_OPTION: PathOption = {
	legs: [
		{
			lineId: '4200_0',
			lineName: '758',
			originStopId: '070001',
			destinationStopId: '070003',
			departureTime: '08:00',
			arrivalTime: '08:15',
		},
		{
			lineId: '4300_0',
			lineName: '112',
			originStopId: '070003',
			destinationStopId: '070002',
			departureTime: '08:18',
			arrivalTime: '08:30',
		},
	],
	totalTimeMinutes: 30,
	estimatedFare: 2.7,
}

describe('TripResult', () => {
	let fixture: ComponentFixture<TripResult>

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TripResult],
			providers: [provideRouter([])],
		})

		fixture = TestBed.createComponent(TripResult)
		fixture.componentRef.setInput('option', DIRECT_OPTION)
		fixture.componentRef.setInput('optionIndex', 0)
		fixture.componentRef.setInput('originStopId', '070001')
		fixture.componentRef.setInput('destinationStopId', '070002')
	})

	it('shows the total time and estimated fare', () => {
		fixture.detectChanges()

		expect(fixture.nativeElement.textContent).toContain('20')
		expect(fixture.nativeElement.textContent).toContain('1,3')
	})

	it('shows no transfers for a direct trip', () => {
		fixture.detectChanges()

		expect(fixture.nativeElement.textContent).toContain('Trajeto direto')
	})

	it('shows the number of transfers for a trip with a transfer', () => {
		fixture.componentRef.setInput('option', TRANSFER_OPTION)
		fixture.detectChanges()

		expect(fixture.nativeElement.textContent).toContain('1 transbordo')
	})

	it('lists each leg in sequence with its line and times', () => {
		fixture.componentRef.setInput('option', TRANSFER_OPTION)
		fixture.detectChanges()

		const legTexts = Array.from(
			fixture.nativeElement.querySelectorAll('li'),
		).map((el) => (el as HTMLElement).textContent)

		expect(legTexts.length).toBe(2)
		expect(legTexts[0]).toContain('758')
		expect(legTexts[0]).toContain('08:00')
		expect(legTexts[1]).toContain('112')
		expect(legTexts[1]).toContain('08:30')
	})

	it('links to the trip detail page with the origin, destination, departure time and option index', () => {
		fixture.componentRef.setInput('departureTime', '2026-07-23T08:00')
		fixture.detectChanges()

		const link = fixture.nativeElement.querySelector('a')
		expect(link.getAttribute('href')).toContain('/trip-detail')
		expect(link.getAttribute('href')).toContain('originStopId=070001')
		expect(link.getAttribute('href')).toContain('destinationStopId=070002')
		expect(link.getAttribute('href')).toContain('optionIndex=0')
		expect(link.getAttribute('href')).toContain(
			'departureTime=2026-07-23T08:00',
		)
	})

	it('includes the given option index in the trip detail link', () => {
		fixture.componentRef.setInput('optionIndex', 2)
		fixture.detectChanges()

		const link = fixture.nativeElement.querySelector('a')
		expect(link.getAttribute('href')).toContain('optionIndex=2')
	})
})
