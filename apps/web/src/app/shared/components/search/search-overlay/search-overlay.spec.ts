import { ComponentFixture, TestBed } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import { CarrisService } from '@core/services/carris.service'
import { carrisServiceMock } from '@core/testing/mocks'
import { HlmDialog } from '@spartan-ng/helm/dialog'
import { beforeEach, describe, expect, it } from 'vitest'
import { LineSearch } from '@/shared/components/search/line-search/line-search'
import { StopSearch } from '@/shared/components/search/stop-search/stop-search'
import { SearchOverlay } from './search-overlay'

describe('SearchOverlay', () => {
	let fixture: ComponentFixture<SearchOverlay>
	let component: SearchOverlay

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [SearchOverlay],
			providers: [{ provide: CarrisService, useValue: carrisServiceMock }],
		})

		fixture = TestBed.createComponent(SearchOverlay)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('renders a trigger button to open the search dialog', () => {
		const trigger: HTMLButtonElement = fixture.nativeElement.querySelector(
			'button[aria-label="Pesquisar"]',
		)

		expect(trigger).not.toBeNull()
	})

	it('starts on the "linha" tab', () => {
		expect(component.activeTab()).toBe('linha')
	})

	it('switches the active tab when a trigger is activated', () => {
		component.onTabActivated('paragem')
		expect(component.activeTab()).toBe('paragem')

		component.onTabActivated('linha')
		expect(component.activeTab()).toBe('linha')
	})

	it('ignores unknown tab activations', () => {
		component.onTabActivated('unknown')
		expect(component.activeTab()).toBe('linha')
	})

	it('tells LineSearch and StopSearch to show all results for an empty query', () => {
		const trigger: HTMLButtonElement = fixture.nativeElement.querySelector(
			'button[aria-label="Pesquisar"]',
		)
		trigger.click()
		fixture.detectChanges()

		const lineSearch = fixture.debugElement.query(By.directive(LineSearch))
		const stopSearch = fixture.debugElement.query(By.directive(StopSearch))

		expect(lineSearch.componentInstance.showAllOnEmptyQuery()).toBe(true)
		expect(stopSearch.componentInstance.showAllOnEmptyQuery()).toBe(true)
	})

	describe('closing the dialog', () => {
		function openDialog(): void {
			const trigger: HTMLButtonElement = fixture.nativeElement.querySelector(
				'button[aria-label="Pesquisar"]',
			)
			trigger.click()
			fixture.detectChanges()
		}

		function dialogState(): string {
			return fixture.debugElement
				.query(By.directive(HlmDialog))
				.componentInstance.stateComputed()
		}

		it('opens the dialog when the trigger is clicked', () => {
			openDialog()

			expect(dialogState()).toBe('open')
		})

		it('closes when the close button is clicked', () => {
			openDialog()

			const closeButton: HTMLButtonElement = fixture.debugElement.query(
				By.css('[hlmDialogClose]'),
			).nativeElement
			closeButton.click()
			fixture.detectChanges()

			expect(dialogState()).toBe('closed')
		})

		it('closes when Escape is pressed', () => {
			openDialog()

			const content = fixture.debugElement.query(
				By.directive(LineSearch),
			).nativeElement
			content.dispatchEvent(
				new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
			)
			fixture.detectChanges()

			expect(dialogState()).toBe('closed')
		})

		it('closes when the backdrop is clicked', () => {
			openDialog()

			const backdrop: HTMLElement | null = document.querySelector(
				'.cdk-overlay-backdrop',
			)
			expect(backdrop).not.toBeNull()
			backdrop?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
			fixture.detectChanges()

			expect(dialogState()).toBe('closed')
		})
	})
})
