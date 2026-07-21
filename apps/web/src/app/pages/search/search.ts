import { Component } from '@angular/core'
import { LineSearch } from '@/shared/components/search/line-search/line-search'
import { StopSearch } from '@/shared/components/search/stop-search/stop-search'

@Component({
	selector: 'app-search',
	imports: [LineSearch, StopSearch],
	templateUrl: './search.html',
})
export class Search {}
