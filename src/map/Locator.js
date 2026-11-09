import L from 'leaflet';
import 'leaflet.markercluster';
import { isTileUrl, tilesOf } from './tiles';
import { markerOf, zoomOf } from '../utils/look';

// Leaflet puts itself on window.L: give back the Leaflet a theme or another plugin may have there
L.noConflict();

const PIN = '<svg viewBox="0 0 32 42" aria-hidden="true" focusable="false"><path d="M16 1C7.7 1 1 7.6 1 15.8 1 27 16 41 16 41s15-14 15-25.2C31 7.6 24.3 1 16 1z" fill="currentColor" stroke="#fff" stroke-width="2"/><circle cx="16" cy="15.5" r="5.5" fill="#fff"/></svg>';
const OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const escape = ( value ) => String( value ).replace( /[&<>"']/g, ( c ) => '&#' + c.charCodeAt( 0 ) + ';' );

const pin = ( className ) => L.divIcon( { className, html: PIN, iconSize: [ 32, 42 ], iconAnchor: [ 16, 41 ], popupAnchor: [ 0, -36 ] } );
// the editor: the store being edited, which can be dragged
const editIcon = pin( 'alsl_marker alsl_marker_edit' );
// the block's own picture, in a 40px box standing on its bottom edge, or the pin
const iconOf = ( image ) => ( image
	? L.divIcon( { className: 'alsl_marker alsl_marker_image', html: '<img src="' + escape( image ) + '" alt="">', iconSize: [ 40, 40 ], iconAnchor: [ 20, 40 ], popupAnchor: [ 0, -36 ] } )
	: pin( 'alsl_marker' ) );

const clusterIcon = ( cluster ) => L.divIcon( {
	className: 'alsl_cluster',
	html: '<span>' + cluster.getChildCount() + '</span>',
	iconSize: L.point( 40, 40 ),
} );

// the map of one block; the stores come from the block's list (render.php, or the editor's preview)
export default class Locator {
	constructor( el, config, text ) {
		this.el = el;
		this.box = el.querySelector( '.alsl_map' );
		this.list = el.querySelector( '.alsl_list' );
		this.config = config;
		this.text = text;
		this.markers = new Map();
		this.key = null;
		this.onClick = this.onClick.bind( this );
		this.onKey = this.onKey.bind( this );
	}

	init() {
		const map = L.map( this.box, { zoomControl: false, scrollWheelZoom: false } );
		this.map = map;
		L.control.zoom( { zoomInTitle: this.text.zoomIn, zoomOutTitle: this.text.zoomOut } ).addTo( map );
		// only the credit the map data's license asks for: no "Leaflet" link on the site (WordPress.org guideline 10)
		map.attributionControl.setPrefix( false );
		this.cluster = L.markerClusterGroup( { showCoverageOnHover: false, maxClusterRadius: 50, iconCreateFunction: clusterIcon } ).addTo( map );
		// the editor's draggable marker, outside the clusters
		this.loose = L.layerGroup().addTo( map );
		// the editor: a click puts the store being edited there, when it has no place yet
		map.on( 'click', ( event ) => this.placing && this.send( 'alsl:moved', { id: this.editing, lat: event.latlng.lat, lng: event.latlng.lng } ) );

		// the mouse wheel zooms only after the visitor uses the map, so the page scrolls past it
		map.on( 'focus click', () => map.scrollWheelZoom.enable() );
		map.on( 'blur mouseout', () => map.scrollWheelZoom.disable() );

		this.el.addEventListener( 'click', this.onClick );
		this.el.addEventListener( 'keydown', this.onKey );
		// the block changes size with the window, the editor's sidebars and the layout
		if ( 'ResizeObserver' in window ) {
			this.resize = new window.ResizeObserver( () => map.invalidateSize() );
			this.resize.observe( this.box );
		}
		this.update( this.config );
	}

	tiles( config ) {
		const url = tilesOf( config.tiles );
		// the block's credit is for its own tile server, not for OpenStreetMap's
		const credit = OSM + ( config.credit && isTileUrl( config.tiles ) ? ' | ' + escape( config.credit ) : '' );
		if ( this.layer && this.layer.url === url && this.layer.credit === credit ) {
			return;
		}
		this.layer?.remove();
		this.layer = L.tileLayer( url, { maxZoom: 19, attribution: credit } ).addTo( this.map );
		Object.assign( this.layer, { url, credit } );
	}

	// stores with a place on the map, as the list shows them now
	items() {
		return [ ...this.list.querySelectorAll( '.alsl_store[data-lat][data-lng]:not([hidden])' ) ]
			.map( ( item ) => ( { item, id: item.dataset.id, lat: Number( item.dataset.lat ), lng: Number( item.dataset.lng ) } ) )
			.filter( ( s ) => Number.isFinite( s.lat ) && Number.isFinite( s.lng ) && Math.abs( s.lat ) <= 90 && Math.abs( s.lng ) <= 180 );
	}

	// reads the list again: the editor calls this after every change
	update( config = this.config ) {
		this.config = config;
		this.tiles( config );
		const editing = config.editor && 'string' === typeof config.editing ? config.editing : '';
		const icon = iconOf( markerOf( config.look ) );
		const stores = this.items();
		this.cluster.clearLayers();
		this.loose.clearLayers();
		this.markers.clear();
		let edited = null;
		const markers = stores.map( ( { item, id, lat, lng } ) => {
			const name = item.querySelector( '.alsl_name' )?.textContent || '';
			const mine = id === editing;
			const marker = L.marker( [ lat, lng ], { icon: mine ? editIcon : icon, title: name, alt: name, keyboard: true, draggable: mine, zIndexOffset: mine ? 1000 : 0 } );
			marker.bindPopup( () => this.popup( id ), { maxWidth: 280 } );
			marker.on( 'click', () => this.select( id, false ) );
			if ( mine ) {
				marker.on( 'dragend', () => {
					const place = marker.getLatLng();
					this.send( 'alsl:moved', { id, lat: place.lat, lng: place.lng } );
				} );
				edited = marker;
			}
			this.markers.set( id, marker );
			item.tabIndex = 0;
			return marker;
		} );
		this.cluster.addLayers( markers.filter( ( marker ) => marker !== edited ) );
		edited?.addTo( this.loose );

		// where the visitor's search started: the place found, or their own location
		const origin = this.el.alslOrigin;
		if ( origin ) {
			L.circleMarker( [ origin.lat, origin.lng ], { radius: 8, weight: 3, color: '#fff', fillColor: '#2563eb', fillOpacity: 1, className: 'alsl_origin' } )
				// Leaflet puts a string tooltip in as HTML: the name comes from the geocoder, so it goes in as text
				.bindTooltip( escape( origin.label ) )
				.addTo( this.loose );
		}

		this.placing = !! editing && ! edited;
		this.box.classList.toggle( 'alsl_placing', this.placing );
		this.list.querySelectorAll( '.alsl_store' ).forEach( ( item ) => item.classList.toggle( 'alsl_active', !! editing && item.dataset.id === editing ) );

		// the view moves when the stores shown or the search change, not when a store is edited or dragged
		const key = zoomOf( config.look ) + '|' + ( origin ? origin.lat + ',' + origin.lng + '|' : '' ) + stores.map( ( s ) => s.id ).join( ';' );
		if ( key !== this.key ) {
			this.key = key;
			this.fit( stores, origin );
		}
		// the store opened for editing, just given a place, or moved out of sight comes into view, close up
		if ( edited && ( editing !== this.editing || ! this.edited || ! this.map.getBounds().contains( edited.getLatLng() ) ) ) {
			this.map.setView( edited.getLatLng(), Math.max( this.map.getZoom(), 14 ) );
		}
		this.editing = editing;
		this.edited = !! edited;
	}

	send( type, detail ) {
		this.el.dispatchEvent( new window.CustomEvent( type, { detail } ) );
	}

	fit( stores, origin ) {
		if ( origin ) {
			// the place and the nearest stores (the list is sorted by distance)
			const points = [ origin, ...stores.slice( 0, 5 ) ].map( ( p ) => [ p.lat, p.lng ] );
			if ( 1 === points.length ) {
				this.map.setView( points[ 0 ], 12 );
			} else {
				this.map.fitBounds( L.latLngBounds( points ), { padding: [ 40, 40 ], maxZoom: 15 } );
			}
		} else if ( ! stores.length ) {
			this.map.setView( [ 20, 0 ], 2 );
		} else if ( zoomOf( this.config.look ) ) {
			// a fixed zoom, on the store nearest the middle of them all, so a pin is always in view
			const middle = L.latLngBounds( stores.map( ( s ) => [ s.lat, s.lng ] ) ).getCenter();
			const near = stores.reduce( ( best, s ) => ( middle.distanceTo( [ s.lat, s.lng ] ) < middle.distanceTo( [ best.lat, best.lng ] ) ? s : best ) );
			this.map.setView( [ near.lat, near.lng ], zoomOf( this.config.look ) );
		} else if ( 1 === stores.length ) {
			this.map.setView( [ stores[ 0 ].lat, stores[ 0 ].lng ], 15 );
		} else {
			this.map.fitBounds( L.latLngBounds( stores.map( ( s ) => [ s.lat, s.lng ] ) ), { padding: [ 32, 32 ], maxZoom: 15 } );
		}
	}

	itemOf( id ) {
		return [ ...this.list.querySelectorAll( '.alsl_store' ) ].find( ( item ) => item.dataset.id === id );
	}

	// the popup shows the store as the list does
	popup( id ) {
		const info = this.itemOf( id )?.querySelector( '.alsl_info' );
		const content = info ? info.cloneNode( true ) : document.createElement( 'div' );
		content.classList.add( 'alsl_popup' );
		return content;
	}

	// a store picked in the list opens on the map; a marker clicked on the map shows its store in the list
	select( id, fromList ) {
		if ( this.config.editor ) {
			// the editor opens the store's form
			this.send( 'alsl:pick', { id } );
			return;
		}
		const item = this.itemOf( id );
		this.list.querySelectorAll( '.alsl_active' ).forEach( ( el ) => el.classList.remove( 'alsl_active' ) );
		item?.classList.add( 'alsl_active' );
		const marker = this.markers.get( id );
		if ( fromList && marker ) {
			// a phone: the list is under the map
			const box = this.box.getBoundingClientRect();
			if ( box.top < 0 || box.bottom > window.innerHeight ) {
				this.box.scrollIntoView( { block: 'nearest' } );
			}
			this.cluster.zoomToShowLayer( marker, () => marker.openPopup() );
		} else if ( item && this.list.scrollHeight > this.list.clientHeight ) {
			// the list scrolls next to the map: bring the store into view there, without moving the page
			const top = item.offsetTop - this.list.offsetTop;
			if ( top < this.list.scrollTop || top + item.offsetHeight > this.list.scrollTop + this.list.clientHeight ) {
				this.list.scrollTo( { top: Math.max( 0, top - 8 ) } );
			}
		}
	}

	pick( event ) {
		const item = event.target.closest( '.alsl_store' );
		return item && this.list.contains( item ) && this.markers.has( item.dataset.id ) && ! event.target.closest( 'a, button' ) ? item : null;
	}

	onClick( event ) {
		const item = this.pick( event );
		if ( item ) {
			this.select( item.dataset.id, true );
		}
	}

	onKey( event ) {
		const item = this.pick( event );
		if ( item && item === event.target && ( 'Enter' === event.key || ' ' === event.key ) ) {
			event.preventDefault();
			this.select( item.dataset.id, true );
		}
	}

	destroy() {
		this.resize?.disconnect();
		this.el.removeEventListener( 'click', this.onClick );
		this.el.removeEventListener( 'keydown', this.onKey );
		this.map?.remove();
		this.map = null;
	}
}
