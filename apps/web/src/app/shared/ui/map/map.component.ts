import {
	AfterViewInit,
	Component,
	ElementRef,
	OnDestroy,
	effect,
	input,
	output,
	viewChild,
} from '@angular/core'
import { Map as MapLibreMap, Marker, StyleSpecification } from 'maplibre-gl'
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
	mapClick = output<MapCenter>()

	private readonly mapContainer =
		viewChild.required<ElementRef<HTMLDivElement>>('mapContainer')
	private map?: MapLibreMap
	private markerInstances: Marker[] = []

	constructor() {
		effect(() => {
			const center = this.center()
			this.map?.setCenter([center.lon, center.lat])
		})

		effect(() => {
			const markers = this.markers()
			if (this.map) this.renderMarkers(markers)
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

		this.renderMarkers(this.markers())
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
}
