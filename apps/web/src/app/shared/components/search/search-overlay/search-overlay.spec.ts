import { ComponentFixture, TestBed } from '@angular/core/testing'
import { CarrisService } from '@core/services/carris.service'
import { carrisServiceMock } from '@core/testing/mocks'
import { beforeEach, describe, expect, it } from 'vitest'
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
})
