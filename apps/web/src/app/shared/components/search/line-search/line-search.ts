import { Component, computed, inject, input, signal } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { RouterLink } from '@angular/router'
import { CarrisService } from '@core/services/carris.service'
import { LucideArrowRight } from '@lucide/angular'
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
import { Line } from '@/shared/models/line.model'
import { HlmButton } from '@/shared/ui/button/src'
import { HlmInput } from '@/shared/ui/input/src'
import { LinesState } from './line.interface'

const DEBOUNCE_MS = 300

const NOT_LOADING_EMPTY: LinesState = { loading: false, lines: [] }
const LOADING: LinesState = { loading: true, lines: [] }

function compareShortName(a: string, b: string): number {
	const numericA = Number(a)
	const numericB = Number(b)
	if (Number.isNaN(numericA) || Number.isNaN(numericB)) {
		return a.localeCompare(b)
	}
	return numericA - numericB
}

@Component({
	selector: 'app-line-search',
	imports: [RouterLink, HlmSkeleton, HlmInput, HlmButton, LucideArrowRight],
	templateUrl: './line-search.html',
})
export class LineSearch {
	private readonly carrisService = inject(CarrisService)

	readonly showAllOnEmptyQuery = input(false)

	readonly query = signal('')
	readonly selectedLineId = signal<string | null>(null)

	private readonly state = toSignal(
		toObservable(this.query).pipe(
			debounceTime(DEBOUNCE_MS),
			distinctUntilChanged(),
			switchMap((query): Observable<LinesState> => {
				const shouldSearch =
					query.trim().length > 0 || this.showAllOnEmptyQuery()
				if (!shouldSearch) {
					return of(NOT_LOADING_EMPTY)
				}

				return this.carrisService.searchLines(query).pipe(
					map((lines): LinesState => ({ loading: false, lines })),
					startWith(LOADING),
				)
			}),
		),
		{ initialValue: LOADING },
	)

	readonly loading = computed(() => this.state().loading)
	readonly lines = computed(() => this.state().lines)

	readonly sortedLines = computed((): Line[] =>
		[...this.lines()].sort((a, b) =>
			compareShortName(a.shortName, b.shortName),
		),
	)

	onQueryChange(value: string): void {
		this.query.set(value)
	}

	toggleLine(lineId: string): void {
		this.selectedLineId.update((current) =>
			current === lineId ? null : lineId,
		)
	}
}
