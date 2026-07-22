import { Component, computed, inject, input } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { CarrisService } from '@core/services/carris.service'
import { map, Observable, startWith, switchMap, timer } from 'rxjs'
import { Arrival } from '@/shared/models/arrival.model'

interface ArrivalsState {
	loading: boolean
	arrivals: Arrival[]
}

const INITIAL_STATE: ArrivalsState = { loading: true, arrivals: [] }
const RECALCULATE_INTERVAL_MS = 30_000

interface ArrivalWithMinutes extends Arrival {
	minutesUntilArrival: number
}

function minutesUntilArrival(arrivalTime: string, now: Date): number {
	const [hours, minutes] = arrivalTime.split(':').map(Number)
	const target = new Date(now)
	target.setHours(hours, minutes, 0, 0)

	const halfDayMs = 12 * 60 * 60 * 1000
	if (target.getTime() < now.getTime() - halfDayMs) {
		target.setDate(target.getDate() + 1)
	}

	return Math.round((target.getTime() - now.getTime()) / 60_000)
}

@Component({
	selector: 'app-stop-arrivals-list',
	imports: [],
	templateUrl: './stop-arrivals-list.html',
})
export class StopArrivalsList {
	private readonly carrisService = inject(CarrisService)

	readonly stopId = input.required<string>()
	readonly lineId = input<string | null>(null)

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

	private readonly now = toSignal(
		timer(0, RECALCULATE_INTERVAL_MS).pipe(map(() => new Date())),
		{ initialValue: new Date() },
	)

	readonly loading = computed(() => this.state().loading)
	readonly arrivals = computed(() => {
		const arrivals = this.state().arrivals
		const lineId = this.lineId()
		return lineId
			? arrivals.filter((arrival) => arrival.lineId === lineId)
			: arrivals
	})

	readonly arrivalsWithMinutes = computed((): ArrivalWithMinutes[] => {
		const now = this.now()
		return this.arrivals().map((arrival) => ({
			...arrival,
			minutesUntilArrival: minutesUntilArrival(arrival.arrivalTime, now),
		}))
	})
}
