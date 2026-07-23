import { Component, computed, input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { PathOption } from '@/shared/models/path.model'
import { HlmButton } from '@/shared/ui/button/src'
import { formatFare, transferCount } from '@/shared/utils/path-formatting'

@Component({
	selector: 'app-trip-result',
	imports: [RouterLink, HlmButton],
	templateUrl: './trip-result.html',
})
export class TripResult {
	readonly option = input.required<PathOption>()
	readonly optionIndex = input.required<number>()
	readonly originStopId = input.required<string>()
	readonly destinationStopId = input.required<string>()
	readonly departureTime = input('')

	readonly legs = computed(() => this.option().legs ?? [])
	readonly formattedFare = computed(() =>
		formatFare(this.option().estimatedFare),
	)
	readonly transferCount = computed(() => transferCount(this.legs()))

	readonly detailQueryParams = computed(() => {
		const departureTime = this.departureTime()
		return {
			originStopId: this.originStopId(),
			destinationStopId: this.destinationStopId(),
			optionIndex: this.optionIndex(),
			...(departureTime ? { departureTime } : {}),
		}
	})
}
