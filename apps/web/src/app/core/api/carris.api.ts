import { HttpClient } from '@angular/common/http'
import { inject, Service } from '@angular/core'
import { environment } from '@environments/environment.development'
import { Arrival } from '@/shared/models/arrival.model'
import { Line } from '@/shared/models/line.model'
import { Stop } from '@/shared/models/stop.model'

@Service()
export class CarrisApi {
	private readonly http = inject(HttpClient)
	private readonly baseUrl = `${environment.apiUrl}`

	getStopsNearby(lat: number, lon: number, radius?: number) {
		return this.http.get<Stop[]>(`${this.baseUrl}/stops`, {
			params: radius === undefined ? { lat, lon } : { lat, lon, radius },
		})
	}

	getStopById(id: string) {
		return this.http.get<Stop>(`${this.baseUrl}/stops/${id}`)
	}

	searchLines(query: string) {
		return this.http.get<Line[]>(`${this.baseUrl}/lines`, {
			params: { query },
		})
	}

	getLineById(id: string) {
		return this.http.get<Line>(`${this.baseUrl}/lines/${id}`)
	}

	getArrivals(stopId: string) {
		return this.http.get<Arrival[]>(`${this.baseUrl}/arrivals`, {
			params: { stopId },
		})
	}
}
