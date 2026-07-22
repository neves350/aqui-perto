import { Component, computed, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { CarrisService } from '@core/services/carris.service'
import { GeolocationService } from '@core/services/geolocation.service'
import {
	catchError,
	map,
	merge,
	Observable,
	of,
	Subject,
	startWith,
	switchMap,
} from 'rxjs'
import { StopArrivalsList } from '@/shared/components/stop-arrivals-list/stop-arrivals-list'
import { Stop } from '@/shared/models/stop.model'
import { MapComponent } from '@/shared/ui/map/map.component'
import { MapCenter } from '@/shared/ui/map/map.types'

const DEFAULT_CENTER: MapCenter = { lat: 38.7223, lon: -9.1393 }

type PositionEvent = { type: 'point'; point: MapCenter } | { type: 'error' }

interface DiscoveryState {
	loading: boolean
	geolocationError: boolean
	hasPosition: boolean
	center: MapCenter
	stops: Stop[]
}

const INITIAL_STATE: DiscoveryState = {
	loading: true,
	geolocationError: false,
	hasPosition: false,
	center: DEFAULT_CENTER,
	stops: [],
}

@Component({
	selector: 'app-discovery',
	imports: [MapComponent, StopArrivalsList],
	templateUrl: './discovery.html',
})
export class Discovery {
	private readonly carrisService = inject(CarrisService)
	private readonly geolocationService = inject(GeolocationService)

	private readonly manualPoint = new Subject<MapCenter>()

	private readonly state = toSignal(
		merge(
			this.geolocationService.getCurrentPosition().pipe(
				map((point): PositionEvent => ({ type: 'point', point })),
				catchError(() => of<PositionEvent>({ type: 'error' })),
			),
			this.manualPoint.pipe(
				map((point): PositionEvent => ({ type: 'point', point })),
			),
		).pipe(
			switchMap((event): Observable<DiscoveryState> => {
				if (event.type === 'error') {
					return of({
						loading: false,
						geolocationError: true,
						hasPosition: false,
						center: DEFAULT_CENTER,
						stops: [],
					})
				}

				const { point } = event
				return this.carrisService.getStopsNearby(point.lat, point.lon).pipe(
					map(
						(stops): DiscoveryState => ({
							loading: false,
							geolocationError: false,
							hasPosition: true,
							center: point,
							stops,
						}),
					),
					startWith<DiscoveryState>({
						loading: true,
						geolocationError: false,
						hasPosition: true,
						center: point,
						stops: [],
					}),
					catchError(() =>
						of<DiscoveryState>({
							loading: false,
							geolocationError: false,
							hasPosition: true,
							center: point,
							stops: [],
						}),
					),
				)
			}),
		),
		{ initialValue: INITIAL_STATE },
	)

	readonly loading = computed(() => this.state().loading)
	readonly geolocationError = computed(() => this.state().geolocationError)
	readonly center = computed(() => this.state().center)
	readonly stops = computed(() => this.state().stops)
	readonly userPosition = computed(() =>
		this.state().hasPosition ? this.state().center : null,
	)
	readonly selectedStopId = signal<string | null>(null)

	readonly markers = computed(() =>
		this.stops().map((stop) => ({ id: stop.id, lat: stop.lat, lon: stop.lon })),
	)

	onMapClick(point: MapCenter): void {
		this.manualPoint.next(point)
	}

	selectStop(stopId: string): void {
		this.selectedStopId.set(stopId)
	}
}
