import { Service } from '@angular/core'
import { Observable } from 'rxjs'

export interface GeoPosition {
	lat: number
	lon: number
}

@Service()
export class GeolocationService {
	getCurrentPosition(): Observable<GeoPosition> {
		return new Observable<GeoPosition>((subscriber) => {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					subscriber.next({
						lat: position.coords.latitude,
						lon: position.coords.longitude,
					})
					subscriber.complete()
				},
				(error) => subscriber.error(error),
			)
		})
	}
}
