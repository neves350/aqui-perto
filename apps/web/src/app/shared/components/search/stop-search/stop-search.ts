import { Component, inject, input, signal } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { StopArrivalsList } from '@/shared/components/stop-arrivals-list/stop-arrivals-list'
import { Stop } from '@/shared/models/stop.model'
import { CarrisService } from '@core/services/carris.service'
import { debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs'

const DEBOUNCE_MS = 300

@Component({
	selector: 'app-stop-search',
	imports: [StopArrivalsList],
	templateUrl: './stop-search.html',
})
export class StopSearch {
	private readonly carrisService = inject(CarrisService)

	readonly showAllOnEmptyQuery = input(false)

	readonly query = signal('')
	readonly selectedStopId = signal<string | null>(null)

	readonly stops = toSignal(
		toObservable(this.query).pipe(
			debounceTime(DEBOUNCE_MS),
			distinctUntilChanged(),
			switchMap((query) => {
				if (query.trim().length > 0) {
					return this.carrisService.searchStops(query)
				}
				return this.showAllOnEmptyQuery()
					? this.carrisService.searchStops('')
					: of<Stop[]>([])
			}),
			map((stops) => [...stops].sort((a, b) => a.name.localeCompare(b.name))),
		),
		{ initialValue: [] as Stop[] },
	)

	onQueryChange(value: string): void {
		this.query.set(value)
	}

	toggleStop(stopId: string): void {
		this.selectedStopId.update((current) => (current === stopId ? null : stopId))
	}
}
