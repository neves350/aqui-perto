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

const USER_POSITION_COLOR = '#2563eb'

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
	mapClick = output<MapCenter>()

	private readonly mapContainer =
		viewChild.required<ElementRef<HTMLDivElement>>('mapContainer')
	private map?: MapLibreMap
	private markerInstances: Marker[] = []
	private userMarkerInstance?: Marker

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
}
