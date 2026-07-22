import { effect, Service, signal } from '@angular/core'

type Theme = 'light' | 'dark'

@Service()
export class ThemeService {
	private readonly state = signal<Theme>(this.getInitialTheme())
	readonly theme = this.state.asReadonly()

	constructor() {
		effect(() => {
			const theme = this.state()
			document.documentElement.classList.toggle('dark', theme === 'dark')
			localStorage.setItem('theme', theme)
		})
	}

	toggle(): void {
		this.state.set(this.state() === 'dark' ? 'light' : 'dark')
	}

	private getInitialTheme(): Theme {
		const stored = localStorage.getItem('theme') as Theme | null
		if (stored) return stored
		return window.matchMedia('(prefers-color-scheme: dark)').matches
			? 'dark'
			: 'light'
	}
}
