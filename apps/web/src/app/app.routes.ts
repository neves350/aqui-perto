import { Routes } from '@angular/router'

export const routes: Routes = [
	{
		path: '',
		title: 'Inicio - Aqui Perto',
		loadComponent: () =>
			import('@pages/discovery/discovery').then((m) => m.Discovery),
	},
	{
		path: 'search',
		title: 'Pesquisar - Aqui Perto',
		loadComponent: () => import('@pages/search/search').then((m) => m.Search),
	},
	{
		path: 'lines/:id',
		title: (route) => `Linha ${route.paramMap.get('id')} - Aqui Perto`,
		loadComponent: () =>
			import('@pages/line-detail/line-detail').then((m) => m.LineDetail),
	},
]
