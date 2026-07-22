import { Component, computed, inject, input, signal } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { Router, RouterLink } from '@angular/router'
import { CarrisService } from '@core/services/carris.service'
import { LucideArrowLeft } from '@lucide/angular'
import { catchError, map, Observable, of, startWith, switchMap } from 'rxjs'
import { StopArrivalsList } from '@/shared/components/stop-arrivals-list/stop-arrivals-list'
import { LineRoute } from '@/shared/models/line-route.model'
import { MapComponent } from '@/shared/ui/map/map.component'
import { MapCenter } from '@/shared/ui/map/map.types'
import { getDirectionalLongName } from '@/shared/utils/directional-long-name'

const DEFAULT_CENTER: MapCenter = { lat: 38.7223, lon: -9.1393 }

interface LineDetailState {
	loading: boolean
	route: LineRoute | null
}

const INITIAL_STATE: LineDetailState = { loading: true, route: null }

@Component({
	selector: 'app-line-detail',
	imports: [MapComponent, RouterLink, StopArrivalsList, LucideArrowLeft],
	templateUrl: './line-detail.html',
	styleUrl: './line-detail.css',
})
export class LineDetail {
	private readonly carrisService = inject(CarrisService)
	private readonly router = inject(Router)

	readonly id = input.required<string>()
	readonly direction = input<number>()

	private readonly params = computed(() => ({
		id: this.id(),
		direction: this.direction(),
	}))

	private readonly state = toSignal(
		toObservable(this.params).pipe(
			switchMap(
				({ id, direction }): Observable<LineDetailState> =>
					this.carrisService.getLineRoute(id, direction).pipe(
						map((route): LineDetailState => ({ loading: false, route })),
						startWith<LineDetailState>({ loading: true, route: null }),
						catchError(() =>
							of<LineDetailState>({ loading: false, route: null }),
						),
					),
			),
		),
		{ initialValue: INITIAL_STATE },
	)

	readonly loading = computed(() => this.state().loading)
	readonly route = computed(() => this.state().route)

	readonly directionalLongName = computed(() => {
		const line = this.route()
		return line ? getDirectionalLongName(line.longName, line.headsign) : ''
	})

	readonly mapStops = computed(() =>
		(this.route()?.stops ?? []).map(
			(stop): MapCenter => ({ lat: stop.lat, lon: stop.lon }),
		),
	)

	readonly mapRoute = computed(() => {
		const shape = this.route()?.shape ?? []
		return shape.length > 0 ? shape : this.mapStops()
	})

	readonly center = computed(() => this.mapStops()[0] ?? DEFAULT_CENTER)

	readonly selectedStopId = signal<string | null>(null)

	selectDirection(directionId: number): void {
		this.router.navigate([], {
			queryParams: { direction: directionId },
			queryParamsHandling: 'merge',
		})
	}

	selectStop(stopId: string): void {
		this.selectedStopId.update((current) =>
			current === stopId ? null : stopId,
		)
	}
}
