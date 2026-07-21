import { Component, inject, signal } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { Line } from '@/shared/models/line.model'
import { CarrisService } from '@core/services/carris.service'
import { debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs'

const DEBOUNCE_MS = 300

@Component({
	selector: 'app-line-search',
	imports: [],
	templateUrl: './line-search.html',
})
export class LineSearch {
	private readonly carrisService = inject(CarrisService)

	readonly query = signal('')
	readonly selectedLineId = signal<string | null>(null)

	readonly lines = toSignal(
		toObservable(this.query).pipe(
			debounceTime(DEBOUNCE_MS),
			distinctUntilChanged(),
			switchMap((query) =>
				query.trim().length === 0
					? of<Line[]>([])
					: this.carrisService.searchLines(query),
			),
		),
		{ initialValue: [] as Line[] },
	)

	onQueryChange(value: string): void {
		this.query.set(value)
	}

	toggleLine(lineId: string): void {
		this.selectedLineId.update((current) => (current === lineId ? null : lineId))
	}
}
