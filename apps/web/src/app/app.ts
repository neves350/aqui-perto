import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { Footer } from './layout/footer/footer'
import { Navbar } from './layout/navbar/navbar'

@Component({
	selector: 'app-root',
	imports: [RouterOutlet, Navbar, Footer],
	template: `
		<div class="relative flex min-h-screen flex-col">
			<app-navbar />

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
