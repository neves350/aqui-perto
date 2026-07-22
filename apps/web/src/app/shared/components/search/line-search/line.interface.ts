import { Line } from '@/shared/models/line.model'

export interface LineGroup {
	color: string
	lines: Line[]
}

export interface LinesState {
	loading: boolean
	lines: Line[]
}
