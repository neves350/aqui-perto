import { Component, inject, signal } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { StopArrivalsList } from '@/shared/components/stop-arrivals-list/stop-arrivals-list'
import { Stop } from '@/shared/models/stop.model'
import { CarrisService } from '@core/services/carris.service'
import { debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs'

const DEBOUNCE_MS = 300

@Component({
	selector: 'app-stop-search',
	imports: [StopArrivalsList],
	templateUrl: './stop-search.html',
})
export class StopSearch {
	private readonly carrisService = inject(CarrisService)

	readonly query = signal('')
	readonly selectedStopId = signal<string | null>(null)

	readonly stops = toSignal(
		toObservable(this.query).pipe(
			debounceTime(DEBOUNCE_MS),
			distinctUntilChanged(),
			switchMap((query) =>
				query.trim().length === 0
					? of<Stop[]>([])
					: this.carrisService.searchStops(query),
			),
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
