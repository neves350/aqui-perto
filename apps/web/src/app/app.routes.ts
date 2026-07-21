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
]
