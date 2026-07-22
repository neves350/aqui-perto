import { Component, signal } from '@angular/core'
import { LucideSearch } from '@lucide/angular'
import { HlmButton } from '@spartan-ng/helm/button'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import { HlmTabsImports } from '@spartan-ng/helm/tabs'
import { LineSearch } from '@/shared/components/search/line-search/line-search'
import { StopSearch } from '@/shared/components/search/stop-search/stop-search'

type SearchTab = 'linha' | 'paragem'

@Component({
	selector: 'app-search-overlay',
	imports: [
		LucideSearch,
		HlmButton,
		HlmDialogImports,
		HlmTabsImports,
		LineSearch,
		StopSearch,
	],
	templateUrl: './search-overlay.html',
})
export class SearchOverlay {
	readonly activeTab = signal<SearchTab>('linha')

	onTabActivated(tab: string): void {
		if (tab === 'linha' || tab === 'paragem') {
			this.activeTab.set(tab)
		}
	}
}
