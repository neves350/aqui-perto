import { Component, computed, inject, input, signal } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { CarrisService } from '@core/services/carris.service'
import { HlmSkeleton } from '@spartan-ng/helm/skeleton'
import {
	debounceTime,
	distinctUntilChanged,
	map,
	Observable,
	of,
	startWith,
	switchMap,
} from 'rxjs'
import { StopArrivalsList } from '@/shared/components/stop-arrivals-list/stop-arrivals-list'
import { Stop } from '@/shared/models/stop.model'
import { HlmButton } from '@/shared/ui/button/src'
import { HlmInput } from '@/shared/ui/input/src'

const DEBOUNCE_MS = 300

interface StopsState {
	loading: boolean
	stops: Stop[]
}

const NOT_LOADING_EMPTY: StopsState = { loading: false, stops: [] }
const LOADING: StopsState = { loading: true, stops: [] }

function sortByName(stops: Stop[]): Stop[] {
	return [...stops].sort((a, b) => a.name.localeCompare(b.name))
}

@Component({
	selector: 'app-stop-search',
	imports: [StopArrivalsList, HlmSkeleton, HlmInput, HlmButton],
	templateUrl: './stop-search.html',
})
export class StopSearch {
	private readonly carrisService = inject(CarrisService)

	readonly showAllOnEmptyQuery = input(false)

	readonly query = signal('')
	readonly selectedStopId = signal<string | null>(null)

	private readonly state = toSignal(
		toObservable(this.query).pipe(
			debounceTime(DEBOUNCE_MS),
			distinctUntilChanged(),
			switchMap((query): Observable<StopsState> => {
				const shouldSearch =
					query.trim().length > 0 || this.showAllOnEmptyQuery()
				if (!shouldSearch) {
					return of(NOT_LOADING_EMPTY)
				}

				return this.carrisService.searchStops(query).pipe(
					map(
						(stops): StopsState => ({
							loading: false,
							stops: sortByName(stops),
						}),
					),
					startWith(LOADING),
				)
			}),
		),
		{ initialValue: LOADING },
	)

	readonly loading = computed(() => this.state().loading)
	readonly stops = computed(() => this.state().stops)

	onQueryChange(value: string): void {
		this.query.set(value)
	}

	toggleStop(stopId: string): void {
		this.selectedStopId.update((current) =>
			current === stopId ? null : stopId,
		)
	}
}
