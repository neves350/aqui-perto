import { Component, computed, inject, input, signal } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { RouterLink } from '@angular/router'
import { Line } from '@/shared/models/line.model'
import { CarrisService } from '@core/services/carris.service'
import { debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs'

const DEBOUNCE_MS = 300

interface LineGroup {
	color: string
	lines: Line[]
}

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
	imports: [RouterLink],
	templateUrl: './line-search.html',
})
export class LineSearch {
	private readonly carrisService = inject(CarrisService)

	readonly showAllOnEmptyQuery = input(false)

	readonly query = signal('')
	readonly selectedLineId = signal<string | null>(null)

	readonly lines = toSignal(
		toObservable(this.query).pipe(
			debounceTime(DEBOUNCE_MS),
			distinctUntilChanged(),
			switchMap((query) => {
				if (query.trim().length > 0) {
					return this.carrisService.searchLines(query)
				}
				return this.showAllOnEmptyQuery()
					? this.carrisService.searchLines('')
					: of<Line[]>([])
			}),
		),
		{ initialValue: [] as Line[] },
	)

	readonly groupedLines = computed((): LineGroup[] => {
		const byColor = new Map<string, Line[]>()
		for (const line of this.lines()) {
			const group = byColor.get(line.color)
			if (group) {
				group.push(line)
			} else {
				byColor.set(line.color, [line])
			}
		}

		const groups = Array.from(byColor, ([color, lines]): LineGroup => ({
			color,
			lines: [...lines].sort((a, b) => compareShortName(a.shortName, b.shortName)),
		}))

		return groups.sort((a, b) =>
			compareShortName(a.lines[0].shortName, b.lines[0].shortName),
		)
	})

	onQueryChange(value: string): void {
		this.query.set(value)
	}

	toggleLine(lineId: string): void {
		this.selectedLineId.update((current) => (current === lineId ? null : lineId))
	}
}
