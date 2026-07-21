import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { Footer } from './layout/footer/footer'

@Component({
	selector: 'app-root',
	imports: [RouterOutlet, Footer],
	template: `
		<div class="relative flex min-h-screen flex-col">
  		<main class="relative z-10 flex-1 pt-20 sm:pt-24">
    		<router-outlet />
  		</main>

			<footer class="border-t border-border/60">
    		<app-footer />
  		</footer>
		</div>
	`,
})
export class App {}
