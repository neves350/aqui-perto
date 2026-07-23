import { Component, computed, input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { PathResult } from '@/shared/models/path.model'
import { HlmButton } from '@/shared/ui/button/src'
import { formatFare, transferCount } from '@/shared/utils/path-formatting'

@Component({
	selector: 'app-trip-result',
	imports: [RouterLink, HlmButton],
	templateUrl: './trip-result.html',
})
export class TripResult {
	readonly result = input.required<PathResult>()
	readonly originStopId = input.required<string>()
	readonly destinationStopId = input.required<string>()
	readonly departureTime = input('')

	readonly legs = computed(() => this.result().legs ?? [])
	readonly formattedFare = computed(() =>
		formatFare(this.result().estimatedFare),
	)
	readonly transferCount = computed(() => transferCount(this.legs()))

	readonly detailQueryParams = computed(() => {
		const departureTime = this.departureTime()
		return {
			originStopId: this.originStopId(),
			destinationStopId: this.destinationStopId(),
			...(departureTime ? { departureTime } : {}),
		}
	})
}
