import { Component, computed, inject, viewChild } from '@angular/core'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { ThemeService } from '@core/services/theme.service'
import {
	LucideDynamicIcon,
	LucideMenu,
	LucideMoon,
	LucideSun,
} from '@lucide/angular'
import { HlmButton } from '@spartan-ng/helm/button'
import {
	HlmSheet,
	HlmSheetContent,
	HlmSheetHeader,
	HlmSheetPortal,
	HlmSheetTitle,
	HlmSheetTrigger,
} from '@spartan-ng/helm/sheet'

@Component({
	selector: 'app-navbar',
	imports: [
		RouterLink,
		RouterLinkActive,
		LucideDynamicIcon,
		LucideMenu,
		HlmButton,
		HlmSheet,
		HlmSheetContent,
		HlmSheetHeader,
		HlmSheetPortal,
		HlmSheetTitle,
		HlmSheetTrigger,
	],
	templateUrl: './navbar.html',
	styles: `
    .content-width {
	    width: 100%;
	    max-width: var(--container-5xl); /* 1024px in Tailwind v4 */
	    padding-inline: calc(var(--spacing) * 5); /* 20px */
	    margin-inline: auto;
    }

    @media (min-width: 40rem) {
	    .content-width {
		    padding-inline: calc(var(--spacing) * 8); /* 32px */
	    }
    }
  `,
})
export class Navbar {
	private readonly themeService = inject(ThemeService)
	private readonly mobileMenu = viewChild(HlmSheet)

	readonly icon = computed(() =>
		this.themeService.theme() === 'dark' ? LucideSun : LucideMoon,
	)

	toggleTheme(): void {
		this.themeService.toggle()
	}

	closeMobileMenu(): void {
		this.mobileMenu()?.close()
	}
}
