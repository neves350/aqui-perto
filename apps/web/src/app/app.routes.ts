import { Routes } from '@angular/router'

export const routes: Routes = [
	{
		path: '',
		title: 'Inicio - Aqui Perto',
		loadComponent: () =>
			import('@pages/discovery/discovery').then((m) => m.Discovery),
	},
	{
		path: 'lines/:id',
		title: (route) => `Linha ${route.paramMap.get('id')} - Aqui Perto`,
		loadComponent: () =>
			import('@pages/line-detail/line-detail').then((m) => m.LineDetail),
	},
	{
		path: 'trip-planner',
		title: 'Planear viagem - Aqui Perto',
		loadComponent: () =>
			import('@pages/trip-planner/trip-planner').then((m) => m.TripPlanner),
	},
]
