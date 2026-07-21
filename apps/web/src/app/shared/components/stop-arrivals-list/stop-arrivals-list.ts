import { Component, computed, inject, input } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { Arrival } from '@/shared/models/arrival.model'
import { CarrisService } from '@core/services/carris.service'
import { Observable, map, startWith, switchMap } from 'rxjs'

interface ArrivalsState {
	loading: boolean
	arrivals: Arrival[]
}

const INITIAL_STATE: ArrivalsState = { loading: true, arrivals: [] }

@Component({
	selector: 'app-stop-arrivals-list',
	imports: [],
	templateUrl: './stop-arrivals-list.html',
})
export class StopArrivalsList {
	private readonly carrisService = inject(CarrisService)

	readonly stopId = input.required<string>()

	private readonly state = toSignal(
		toObservable(this.stopId).pipe(
			switchMap(
				(stopId): Observable<ArrivalsState> =>
					this.carrisService.getArrivals(stopId).pipe(
						map((arrivals) => ({ loading: false, arrivals })),
						startWith(INITIAL_STATE),
					),
			),
		),
		{ initialValue: INITIAL_STATE },
	)

	readonly loading = computed(() => this.state().loading)
	readonly arrivals = computed(() => this.state().arrivals)
}
