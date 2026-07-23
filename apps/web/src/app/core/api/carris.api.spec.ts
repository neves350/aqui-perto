import { provideHttpClient } from '@angular/common/http'
import {
	HttpTestingController,
	provideHttpClientTesting,
} from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { environment } from '@environments/environment.development'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CarrisApi } from './carris.api'

describe('CarrisApi', () => {
	let api: CarrisApi
	let httpMock: HttpTestingController

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideHttpClient(), provideHttpClientTesting()],
		})

		api = TestBed.inject(CarrisApi)
		httpMock = TestBed.inject(HttpTestingController)
	})

	afterEach(() => {
		httpMock.verify()
	})

	it('getStopsNearby requests /stops with lat/lon/radius params', () => {
		api.getStopsNearby(38.7223, -9.1393, 400).subscribe()

		const req = httpMock.expectOne(
			(r) =>
				r.url === `${environment.apiUrl}/stops` &&
				r.params.get('lat') === '38.7223' &&
				r.params.get('lon') === '-9.1393' &&
				r.params.get('radius') === '400',
		)
		expect(req.request.method).toBe('GET')
		req.flush([])
	})

	it('getStopById requests /stops/:id', () => {
		api.getStopById('070001').subscribe()

		const req = httpMock.expectOne(`${environment.apiUrl}/stops/070001`)
		expect(req.request.method).toBe('GET')
		req.flush({ id: '070001', name: 'Praça de Espanha', lat: 0, lon: 0 })
	})

	it('searchStops requests /stops with query param', () => {
		api.searchStops('Espanha').subscribe()

		const req = httpMock.expectOne(
			(r) =>
				r.url === `${environment.apiUrl}/stops` &&
				r.params.get('query') === 'Espanha',
		)
		expect(req.request.method).toBe('GET')
		req.flush([])
	})

	it('searchLines requests /lines with query param', () => {
		api.searchLines('758').subscribe()

		const req = httpMock.expectOne(
			(r) =>
				r.url === `${environment.apiUrl}/lines` &&
				r.params.get('query') === '758',
		)
		expect(req.request.method).toBe('GET')
		req.flush([])
	})

	it('getLineRoute requests /lines/:id/route', () => {
		api.getLineRoute('4200_0').subscribe()

		const req = httpMock.expectOne(`${environment.apiUrl}/lines/4200_0/route`)
		expect(req.request.method).toBe('GET')
		req.flush({
			id: '4200_0',
			shortName: '758',
			longName: 'Alameda - Odivelas',
			color: '#FF0000',
			textColor: '#FFFFFF',
			directionId: 0,
			headsign: 'Odivelas',
			directions: [{ directionId: 0, headsign: 'Odivelas' }],
			stops: [],
		})
	})

	it('getLineRoute requests /lines/:id/route with a direction param when given', () => {
		api.getLineRoute('4200_0', 1).subscribe()

		const req = httpMock.expectOne(
			(r) =>
				r.url === `${environment.apiUrl}/lines/4200_0/route` &&
				r.params.get('direction') === '1',
		)
		expect(req.request.method).toBe('GET')
		req.flush({
			id: '4200_0',
			shortName: '758',
			longName: 'Alameda - Odivelas',
			color: '#FF0000',
			textColor: '#FFFFFF',
			directionId: 1,
			headsign: 'Alameda',
			directions: [
				{ directionId: 0, headsign: 'Odivelas' },
				{ directionId: 1, headsign: 'Alameda' },
			],
			stops: [],
		})
	})

	it('getLineById requests /lines/:id', () => {
		api.getLineById('4200_0').subscribe()

		const req = httpMock.expectOne(`${environment.apiUrl}/lines/4200_0`)
		expect(req.request.method).toBe('GET')
		req.flush({
			id: '4200_0',
			shortName: '758',
			longName: 'Alameda - Odivelas',
			color: '#FF0000',
			textColor: '#FFFFFF',
		})
	})

	it('getPath requests /path with originStopId/destinationStopId params', () => {
		api
			.getPath({ originStopId: '070001', destinationStopId: '070002' })
			.subscribe()

		const req = httpMock.expectOne(
			(r) =>
				r.url === `${environment.apiUrl}/path` &&
				r.params.get('originStopId') === '070001' &&
				r.params.get('destinationStopId') === '070002' &&
				!r.params.has('departureTime'),
		)
		expect(req.request.method).toBe('GET')
		req.flush({ found: false, reason: 'no-path-found' })
	})

	it('getPath requests /path with a departureTime param when given', () => {
		api
			.getPath({
				originStopId: '070001',
				destinationStopId: '070002',
				departureTime: '2026-07-23T08:00:00',
			})
			.subscribe()

		const req = httpMock.expectOne(
			(r) =>
				r.url === `${environment.apiUrl}/path` &&
				r.params.get('originStopId') === '070001' &&
				r.params.get('destinationStopId') === '070002' &&
				r.params.get('departureTime') === '2026-07-23T08:00:00',
		)
		expect(req.request.method).toBe('GET')
		req.flush({
			found: true,
			results: [
				{
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
				},
			],
		})
	})

	it('getArrivals requests /arrivals with stopId param', () => {
		api.getArrivals('070001').subscribe()

		const req = httpMock.expectOne(
			(r) =>
				r.url === `${environment.apiUrl}/arrivals` &&
				r.params.get('stopId') === '070001',
		)
		expect(req.request.method).toBe('GET')
		req.flush([])
	})
})
