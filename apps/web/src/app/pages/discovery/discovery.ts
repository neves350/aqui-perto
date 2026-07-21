import { Component, computed, inject, signal } from '@angular/core'
import { StopArrivalsList } from '@/shared/components/stop-arrivals-list/stop-arrivals-list'
import { Stop } from '@/shared/models/stop.model'
import { MapComponent } from '@/shared/ui/map/map.component'
import { MapCenter } from '@/shared/ui/map/map.types'
import { CarrisService } from '@core/services/carris.service'
import { GeolocationService } from '@core/services/geolocation.service'

const DEFAULT_CENTER: MapCenter = { lat: 38.7223, lon: -9.1393 }

@Component({
	selector: 'app-discovery',
	imports: [MapComponent, StopArrivalsList],
	templateUrl: './discovery.html',
	styles: `
		.discovery {
			display: flex;
			flex-direction: column;
			height: 100dvh;
		}

		.discovery__map {
			height: 50%;
		}

		.discovery__panel {
			flex: 1;
			overflow-y: auto;
			padding: 1rem;
		}
	`,
})
export class Discovery {
	private readonly carrisService = inject(CarrisService)
	private readonly geolocationService = inject(GeolocationService)

	readonly loading = signal(true)
	readonly geolocationError = signal(false)
	readonly center = signal<MapCenter>(DEFAULT_CENTER)
	readonly stops = signal<Stop[]>([])
	readonly selectedStopId = signal<string | null>(null)

	readonly markers = computed(() =>
		this.stops().map((stop) => ({ id: stop.id, lat: stop.lat, lon: stop.lon })),
	)

	constructor() {
		this.geolocationService.getCurrentPosition().subscribe({
			next: (position) => {
				this.center.set(position)
				this.loadStops(position)
			},
			error: () => {
				this.geolocationError.set(true)
				this.loading.set(false)
			},
		})
	}

	onMapClick(point: MapCenter): void {
		this.geolocationError.set(false)
		this.loading.set(true)
		this.center.set(point)
		this.loadStops(point)
	}

	selectStop(stopId: string): void {
		this.selectedStopId.set(stopId)
	}

	private loadStops(point: MapCenter): void {
		this.carrisService.getStopsNearby(point.lat, point.lon).subscribe({
			next: (stops) => {
				this.stops.set(stops)
				this.loading.set(false)
			},
			error: () => this.loading.set(false),
		})
	}
}
