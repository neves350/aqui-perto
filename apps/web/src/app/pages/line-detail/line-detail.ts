import { Component, computed, inject, input, signal } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { Router, RouterLink } from '@angular/router'
import { CarrisService } from '@core/services/carris.service'
import { catchError, map, Observable, of, startWith, switchMap } from 'rxjs'
import { StopArrivalsList } from '@/shared/components/stop-arrivals-list/stop-arrivals-list'
import { LineRoute } from '@/shared/models/line-route.model'
import { MapComponent } from '@/shared/ui/map/map.component'
import { MapCenter } from '@/shared/ui/map/map.types'

const DEFAULT_CENTER: MapCenter = { lat: 38.7223, lon: -9.1393 }

interface LineDetailState {
	loading: boolean
	route: LineRoute | null
}

const INITIAL_STATE: LineDetailState = { loading: true, route: null }

@Component({
	selector: 'app-line-detail',
	imports: [MapComponent, RouterLink, StopArrivalsList],
	templateUrl: './line-detail.html',
	styles: `
		.line-detail {
			display: flex;
			flex-direction: column;
			height: 100dvh;
		}

		.line-detail__header {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			padding: 1rem;
		}

		.line-detail__badge {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			padding: 0.25rem 0.5rem;
			border-radius: 0.25rem;
			font-weight: 700;
			font-size: 0.875rem;
		}

		.line-detail__directions {
			display: flex;
			gap: 0.5rem;
			padding: 0 1rem 1rem;
		}

		.line-detail__direction {
			padding: 0.375rem 0.75rem;
			border-radius: 999px;
			border: 1px solid var(--border);
			background: transparent;
			color: inherit;
			cursor: pointer;
		}

		.line-detail__direction--active {
			background: var(--foreground);
			border-color: var(--foreground);
			color: var(--background);
		}

		.line-detail__map {
			height: 40%;
		}

		.line-detail__stops {
			flex: 1;
			overflow-y: auto;
			padding: 1rem;
			list-style: none;
			margin: 0;
		}

		.line-detail__stop {
			display: flex;
			justify-content: space-between;
			width: 100%;
			padding: 0.5rem 0;
			border: none;
			background: transparent;
			color: inherit;
			font: inherit;
			text-align: left;
			cursor: pointer;
		}
	`,
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

	readonly mapRoute = computed(() =>
		(this.route()?.stops ?? []).map(
			(stop): MapCenter => ({ lat: stop.lat, lon: stop.lon }),
		),
	)

	readonly center = computed(() => this.mapRoute()[0] ?? DEFAULT_CENTER)

	readonly selectedStopId = signal<string | null>(null)

	selectDirection(directionId: number): void {
		this.router.navigate([], {
			queryParams: { direction: directionId },
			queryParamsHandling: 'merge',
		})
	}

	selectStop(stopId: string): void {
		this.selectedStopId.update((current) => (current === stopId ? null : stopId))
	}
}
