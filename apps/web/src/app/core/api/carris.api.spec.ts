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
