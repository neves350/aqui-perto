import { Component, computed, inject, input } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { RouterLink } from '@angular/router'
import { CarrisService } from '@core/services/carris.service'
import { catchError, map, Observable, of, startWith, switchMap } from 'rxjs'
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
	imports: [MapComponent, RouterLink],
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
	`,
})
export class LineDetail {
	private readonly carrisService = inject(CarrisService)

	readonly id = input.required<string>()

	private readonly state = toSignal(
		toObservable(this.id).pipe(
			switchMap(
				(id): Observable<LineDetailState> =>
					this.carrisService.getLineRoute(id).pipe(
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
}
