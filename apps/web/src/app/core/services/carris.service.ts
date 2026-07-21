import { inject, Service } from '@angular/core'
import { CarrisApi } from '@core/api/carris.api'

@Service()
export class CarrisService {
	private readonly carrisApi = inject(CarrisApi)

	getStopsNearby(lat: number, lon: number, radius?: number) {
		return this.carrisApi.getStopsNearby(lat, lon, radius)
	}

	getStopById(id: string) {
		return this.carrisApi.getStopById(id)
	}

	searchStops(query: string) {
		return this.carrisApi.searchStops(query)
	}

	searchLines(query: string) {
		return this.carrisApi.searchLines(query)
	}

	getLineById(id: string) {
		return this.carrisApi.getLineById(id)
	}

	getArrivals(stopId: string) {
		return this.carrisApi.getArrivals(stopId)
	}
}
