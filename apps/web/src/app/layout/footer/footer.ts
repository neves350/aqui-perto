import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
	selector: 'app-footer',
	imports: [RouterLink],
	templateUrl: './footer.html',
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
export class Footer {}
