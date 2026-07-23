import { Component, computed, inject, input } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { CarrisService } from '@core/services/carris.service'
import {
	catchError,
	forkJoin,
	map,
	Observable,
	of,
	startWith,
	switchMap,
} from 'rxjs'
import { LineRoute, LineRouteStop } from '@/shared/models/line-route.model'
import { PathLeg, PathResult } from '@/shared/models/path.model'
import { HlmSpinner } from '@/shared/ui/spinner/src'
import { formatFare, legDurationMinutes } from '@/shared/utils/path-formatting'

interface TripDetailState {
	loading: boolean
	result: PathResult | null
}

const INITIAL_STATE: TripDetailState = { loading: true, result: null }

export interface LegDetail {
	leg: PathLeg
	durationMinutes: number
	intermediateStops: LineRouteStop[]
}

function intermediateStops(
	routeStops: LineRouteStop[],
	originStopId: string,
	destinationStopId: string,
): LineRouteStop[] {
	const originIndex = routeStops.findIndex((s) => s.stopId === originStopId)
	const destinationIndex = routeStops.findIndex(
		(s) => s.stopId === destinationStopId,
	)

	if (
		originIndex === -1 ||
		destinationIndex === -1 ||
		originIndex >= destinationIndex
	) {
		return []
	}

	return routeStops.slice(originIndex, destinationIndex + 1)
}

@Component({
	selector: 'app-trip-detail',
	imports: [HlmSpinner],
	templateUrl: './trip-detail.html',
})
export class TripDetail {
	private readonly carrisService = inject(CarrisService)

	readonly originStopId = input.required<string>()
	readonly destinationStopId = input.required<string>()
	readonly departureTime = input<string>()

	/** Populated in PLAN-4. Kept optional so this page doesn't need reworking then. */
	readonly occupancyLevel = input<'low' | 'medium' | 'high' | null>(null)
	/** Populated in PLAN-4. Kept optional so this page doesn't need reworking then. */
	readonly liveMapAvailable = input(false)

	private readonly query = computed(() => ({
		originStopId: this.originStopId(),
		destinationStopId: this.destinationStopId(),
		departureTime: this.departureTime(),
	}))

	private readonly state = toSignal(
		toObservable(this.query).pipe(
			switchMap(
				(query): Observable<TripDetailState> =>
					this.carrisService.getPath(query).pipe(
						map((result): TripDetailState => ({ loading: false, result })),
						startWith<TripDetailState>({ loading: true, result: null }),
						catchError(() =>
							of<TripDetailState>({ loading: false, result: null }),
						),
					),
			),
		),
		{ initialValue: INITIAL_STATE },
	)

	readonly loading = computed(() => this.state().loading)
	readonly result = computed(() => this.state().result)
	readonly legs = computed(() => this.result()?.legs ?? [])

	readonly formattedFare = computed(() =>
		formatFare(this.result()?.estimatedFare),
	)

	private readonly legRoutes = toSignal(
		toObservable(this.legs).pipe(
			switchMap((legs): Observable<LineRoute[]> => {
				if (legs.length === 0) {
					return of([])
				}
				return forkJoin(
					legs.map((leg) => this.carrisService.getLineRoute(leg.lineId)),
				)
			}),
		),
		{ initialValue: [] as LineRoute[] },
	)

	readonly legDetails = computed((): LegDetail[] => {
		const legs = this.legs()
		const routes = this.legRoutes()
		return legs.map((leg, i) => ({
			leg,
			durationMinutes: legDurationMinutes(leg),
			intermediateStops: intermediateStops(
				routes[i]?.stops ?? [],
				leg.originStopId,
				leg.destinationStopId,
			),
		}))
	})
}
