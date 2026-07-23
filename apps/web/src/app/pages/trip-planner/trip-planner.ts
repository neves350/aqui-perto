import { Component, computed, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { CarrisService } from '@core/services/carris.service'
import {
	catchError,
	map,
	Observable,
	of,
	Subject,
	startWith,
	switchMap,
} from 'rxjs'
import { StopSearch } from '@/shared/components/search/stop-search/stop-search'
import { PathQuery, PathResult } from '@/shared/models/path.model'
import { Stop } from '@/shared/models/stop.model'
import { HlmButton } from '@/shared/ui/button/src'
import { HlmInput } from '@/shared/ui/input/src'
import { TripResult } from './trip-result/trip-result'

interface TripPlannerState {
	loading: boolean
	result: PathResult | null
}

const INITIAL_STATE: TripPlannerState = { loading: false, result: null }

@Component({
	selector: 'app-trip-planner',
	imports: [StopSearch, TripResult, HlmButton, HlmInput],
	templateUrl: './trip-planner.html',
})
export class TripPlanner {
	private readonly carrisService = inject(CarrisService)

	private readonly submit = new Subject<PathQuery>()

	readonly originStop = signal<Stop | null>(null)
	readonly destinationStop = signal<Stop | null>(null)
	readonly departureTime = signal('')

	readonly canSubmit = computed(() => {
		const origin = this.originStop()
		const destination = this.destinationStop()
		return (
			origin !== null && destination !== null && origin.id !== destination.id
		)
	})

	private readonly state = toSignal(
		this.submit.pipe(
			switchMap(
				(query): Observable<TripPlannerState> =>
					this.carrisService.getPath(query).pipe(
						map((result): TripPlannerState => ({ loading: false, result })),
						startWith<TripPlannerState>({ loading: true, result: null }),
						catchError(() =>
							of<TripPlannerState>({ loading: false, result: null }),
						),
					),
			),
		),
		{ initialValue: INITIAL_STATE },
	)

	readonly loading = computed(() => this.state().loading)
	readonly result = computed(() => this.state().result)
	readonly options = computed(() => this.result()?.results ?? [])

	readonly selectedStopIds = computed(() => {
		const origin = this.originStop()
		const destination = this.destinationStop()
		return origin && destination
			? { originStopId: origin.id, destinationStopId: destination.id }
			: null
	})

	onOriginSelected(stop: Stop): void {
		this.originStop.set(stop)
	}

	onDestinationSelected(stop: Stop): void {
		this.destinationStop.set(stop)
	}

	clearOrigin(): void {
		this.originStop.set(null)
	}

	clearDestination(): void {
		this.destinationStop.set(null)
	}

	onDepartureTimeChange(value: string): void {
		this.departureTime.set(value)
	}

	onSubmit(): void {
		const origin = this.originStop()
		const destination = this.destinationStop()
		if (!this.canSubmit() || !origin || !destination) {
			return
		}

		const departureTime = this.departureTime()
		this.submit.next({
			originStopId: origin.id,
			destinationStopId: destination.id,
			...(departureTime ? { departureTime } : {}),
		})
	}
}
