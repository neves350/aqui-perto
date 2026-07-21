import { ComponentFixture, TestBed } from '@angular/core/testing'
import { CarrisService } from '@core/services/carris.service'
import { carrisServiceMock } from '@core/testing/mocks'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Search } from './search'

describe('Search', () => {
	let component: Search
	let fixture: ComponentFixture<Search>

	beforeEach(async () => {
		vi.clearAllMocks()

		await TestBed.configureTestingModule({
			imports: [Search],
			providers: [{ provide: CarrisService, useValue: carrisServiceMock }],
		}).compileComponents()

		fixture = TestBed.createComponent(Search)
		component = fixture.componentInstance
		await fixture.whenStable()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
