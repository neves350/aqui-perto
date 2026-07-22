import {
	AfterViewInit,
	Component,
	ElementRef,
	effect,
	input,
	OnDestroy,
	output,
	viewChild,
} from '@angular/core'
import {
	GeoJSONSource,
	Map as MapLibreMap,
	Marker,
	StyleSpecification,
} from 'maplibre-gl'
import { MapCenter, MapMarker } from './map.types'

const OSM_STYLE: StyleSpecification = {
	version: 8,
	sources: {
		osm: {
			type: 'raster',
			tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
			tileSize: 256,
			attribution: '© OpenStreetMap contributors',
		},
	},
	layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
}

const USER_POSITION_COLOR = '#2563eb'
const ROUTE_SOURCE_ID = 'route'
const ROUTE_LAYER_ID = 'route-line'
const ROUTE_LINE_COLOR = '#2563eb'

@Component({
	selector: 'app-map',
	template: `<div #mapContainer class="map-container"></div>`,
	styles: `
		.map-container {
			width: 100%;
			height: 100%;
		}
	`,
})
export class MapComponent implements AfterViewInit, OnDestroy {
	center = input.required<MapCenter>()
	markers = input<MapMarker[]>([])
	userPosition = input<MapCenter | null>(null)
	route = input<MapCenter[]>([])
	mapClick = output<MapCenter>()

	private readonly mapContainer =
		viewChild.required<ElementRef<HTMLDivElement>>('mapContainer')
	private map?: MapLibreMap
	private markerInstances: Marker[] = []
	private userMarkerInstance?: Marker
	private routeMarkerInstances: Marker[] = []
	private routeSourceAdded = false
	private mapLoaded = false

	constructor() {
		effect(() => {
			const center = this.center()
			this.map?.setCenter([center.lon, center.lat])
		})

		effect(() => {
			const markers = this.markers()
			if (this.map) this.renderMarkers(markers)
		})

		effect(() => {
			const userPosition = this.userPosition()
			if (this.map) this.renderUserMarker(userPosition)
		})

		effect(() => {
			const route = this.route()
			if (this.mapLoaded) this.renderRoute(route)
		})
	}

	ngAfterViewInit(): void {
		const center = this.center()
		this.map = new MapLibreMap({
			container: this.mapContainer().nativeElement,
			style: OSM_STYLE,
			center: [center.lon, center.lat],
			zoom: 15,
		})

		this.map.on('click', (event) => {
			this.mapClick.emit({ lat: event.lngLat.lat, lon: event.lngLat.lng })
		})

		this.map.on('load', () => {
			this.mapLoaded = true
			this.renderRoute(this.route())
		})

		this.renderMarkers(this.markers())
		this.renderUserMarker(this.userPosition())
	}

	ngOnDestroy(): void {
		this.map?.remove()
	}

	private renderMarkers(markers: MapMarker[]): void {
		this.markerInstances.forEach((marker) => marker.remove())
		this.markerInstances = markers.map((marker) =>
			new Marker().setLngLat([marker.lon, marker.lat]).addTo(this.map!),
		)
	}

	private renderUserMarker(position: MapCenter | null): void {
		this.userMarkerInstance?.remove()
		this.userMarkerInstance = position
			? new Marker({ color: USER_POSITION_COLOR })
					.setLngLat([position.lon, position.lat])
					.addTo(this.map!)
			: undefined
	}

	private renderRoute(route: MapCenter[]): void {
		this.renderRouteLine(route)
		this.renderRouteMarkers(route)
	}

	private renderRouteLine(route: MapCenter[]): void {
		const map = this.map!
		const data = {
			type: 'Feature' as const,
			properties: {},
			geometry: {
				type: 'LineString' as const,
				coordinates: route.map((point): [number, number] => [
					point.lon,
					point.lat,
				]),
			},
		}

		if (this.routeSourceAdded) {
			;(map.getSource(ROUTE_SOURCE_ID) as GeoJSONSource).setData(data)
			return
		}

		if (route.length === 0) return

		map.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data })
		map.addLayer({
			id: ROUTE_LAYER_ID,
			type: 'line',
			source: ROUTE_SOURCE_ID,
			layout: { 'line-join': 'round', 'line-cap': 'round' },
			paint: { 'line-color': ROUTE_LINE_COLOR, 'line-width': 4 },
		})
		this.routeSourceAdded = true
	}

	private renderRouteMarkers(route: MapCenter[]): void {
		this.routeMarkerInstances.forEach((marker) => {
			marker.remove()
		})
		this.routeMarkerInstances = route.map((point, index) =>
			new Marker({ element: this.createRouteStopElement(index + 1) })
				.setLngLat([point.lon, point.lat])
				.addTo(this.map!),
		)
	}

	private createRouteStopElement(sequence: number): HTMLElement {
		const element = document.createElement('div')
		element.textContent = String(sequence)
		element.setAttribute('role', 'img')
		element.setAttribute('aria-label', `Paragem ${sequence}`)
		element.style.cssText = `
			display: flex;
			align-items: center;
			justify-content: center;
			width: 24px;
			height: 24px;
			border-radius: 50%;
			background: #facc15;
			color: #1f2937;
			font-size: 12px;
			font-weight: 700;
		`
		return element
	}
}
