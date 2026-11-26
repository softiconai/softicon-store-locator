import './public-path';
import { text } from './map/messages';
import { routes } from './map/distance';
import { lookOf } from './utils/look';
import { categoryList, filterOf } from './utils/category';

const SELECTOR = '.alsl_locator';

// Leaflet, markercluster and the map code: their own chunks, loaded only for a block that shows a map
const loadMap = () => import( /* webpackChunkName: "locator" */ './map/Locator' );

const configOf = ( el ) => {
	try {
		const config = JSON.parse( el.dataset.alsl || '{}' );
		return config && 'object' === typeof config ? config : null;
	} catch ( e ) {
		return null;
	}
};

// the search, its own chunk: it works without the map (before "Show map" is clicked, or with no place at all)
const loadFinder = () => import( /* webpackChunkName: "finder" */ './map/search' );

const find = async ( el, config ) => {
	el.alslFinding = true;
	try {
		const { default: Finder } = await loadFinder();
		el.alslFinder = new Finder( el, config, text );
		el.alslFinder.init();
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.error( 'SoftIcon Store Locator:', error );
	}
};

// a <meta> for the store's schema.org microdata
const meta = ( name, value ) => {
	const tag = document.createElement( 'meta' );
	tag.setAttribute( 'itemprop', name );
	tag.content = value;
	return tag;
};

// schema.org data render.php has no room for: the coordinates and the opening times (one rule per time span);
// and "Directions" for each store with a place: a link to the route planner the block names, nothing is loaded
const addPlaces = ( el, config ) => {
	const route = Object.prototype.hasOwnProperty.call( routes, config.route ) && routes[ config.route ];
	el.querySelectorAll( '.alsl_store[itemscope]:not([data-alsl-schema])' ).forEach( ( item ) => {
		item.dataset.alslSchema = '';
		if ( item.dataset.lat && item.dataset.lng ) {
			const geo = Object.assign( document.createElement( 'span' ), { hidden: true } );
			geo.setAttribute( 'itemprop', 'geo' );
			geo.setAttribute( 'itemscope', '' );
			geo.setAttribute( 'itemtype', 'https://schema.org/GeoCoordinates' );
			geo.append( meta( 'latitude', item.dataset.lat ), meta( 'longitude', item.dataset.lng ) );
			item.append( geo );
		}
		( item.dataset.open || '' ).split( ';' ).forEach( ( rule ) => {
			const [ days, spans = '' ] = rule.trim().split( /\s+/ );
			spans.split( ',' ).filter( ( span ) => /^(Mo|Tu|We|Th|Fr|Sa|Su)([-,](Mo|Tu|We|Th|Fr|Sa|Su))*$/.test( days ) && /^([01]\d|2[0-4]):[0-5]\d-([01]\d|2[0-4]):[0-5]\d$/.test( span ) )
				.forEach( ( span ) => item.append( meta( 'openingHours', days + ' ' + span ) ) );
		} );
	} );
	el.querySelectorAll( '.alsl_store[data-lat][data-lng]' ).forEach( ( item ) => {
		const info = item.querySelector( '.alsl_info' );
		if ( ! route || ! info || item.querySelector( '.alsl_route' ) ) {
			return;
		}
		let links = info.querySelector( '.alsl_links' );
		if ( ! links ) {
			links = document.createElement( 'div' );
			links.className = 'alsl_links';
			info.append( links );
		}
		const link = document.createElement( 'a' );
		link.className = 'alsl_route';
		link.href = route( { lat: Number( item.dataset.lat ), lng: Number( item.dataset.lng ) } );
		link.rel = 'noopener';
		link.textContent = text.directions;
		links.append( link );
	} );
};

// the open/closed badges, their own chunk: only for stores with opening times
const showHours = async ( el, config ) => {
	try {
		const { default: hours } = await import( /* webpackChunkName: "hours" */ './map/hours' );
		hours( el, config, text );
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.error( 'SoftIcon Store Locator:', error );
	}
};

const timed = ( el ) => el.querySelector( '.alsl_store[data-open]:not([data-open=""])' );

// the "Open now" setting (openModeOf() in src/utils/hours.js, which stays in the lazy chunks)
const openMode = ( config ) => ( [ 'filter', 'badge' ].includes( config.look?.openNow ) ? config.look.openNow : '' );

const close = ( el ) => {
	el.alsl?.destroy();
	el.alsl = null;
};

const open = async ( el, config ) => {
	el.alslLoading = true;
	try {
		const { default: Locator } = await loadMap();
		if ( el.isConnected && ! el.alsl && el.querySelector( '.alsl_map' ) ) {
			el.alsl = new Locator( el, configOf( el ) || config, text );
			el.alsl.init();
		}
	} catch ( error ) {
		// the list stays, without the map
		close( el );
		el.classList.remove( 'alsl_ready' );
		el.querySelector( '.alsl_map' )?.setAttribute( 'hidden', '' );
		// eslint-disable-next-line no-console
		console.error( 'SoftIcon Store Locator:', error );
	}
	el.alslLoading = false;
};

// "Load the map on click": nothing is loaded from OpenStreetMap before the visitor asks for it
const askFirst = ( el, box, config ) => {
	if ( box.querySelector( '.alsl_consent' ) ) {
		return;
	}
	const consent = document.createElement( 'div' );
	consent.className = 'alsl_consent';
	const note = document.createElement( 'p' );
	note.textContent = text.consent;
	const button = document.createElement( 'button' );
	button.type = 'button';
	button.className = 'alsl_load wp-element-button';
	button.textContent = text.show;
	button.addEventListener( 'click', () => {
		consent.remove();
		open( el, config );
	} );
	consent.append( note, button );
	box.append( consent );
};

// the search box, the category filter when the stores have two categories or more, or "Open now"
const wantsFinder = ( el, config ) => config.search ||
	( filterOf( config.cat ) && categoryList( [ ...el.querySelectorAll( '.alsl_store' ) ].map( ( item ) => item.dataset.cat ) ).length > 1 ) ||
	( 'filter' === openMode( config ) && timed( el ) );

// shows, updates or removes the map to match the block; the editor calls it again after every change
const sync = ( el ) => {
	const config = configOf( el );
	const box = el.querySelector( '.alsl_map' );
	if ( config && ! config.editor && ! el.alslFinding && wantsFinder( el, config ) ) {
		find( el, config );
	}
	// the editor also shows the map for a store being edited that has no place yet, to click it in
	if ( ! config || ! box || ! ( el.querySelector( '.alsl_store[data-lat][data-lng]' ) || ( config.editor && config.editing ) ) ) {
		close( el );
		return;
	}
	if ( el.alsl ) {
		el.alsl.update( config );
		return;
	}
	if ( el.alslLoading ) {
		return;
	}
	box.hidden = false;
	el.classList.add( 'alsl_ready' );
	if ( config.click && ! config.editor ) {
		askFirst( el, box, config );
	} else {
		open( el, config );
	}
};

const whenNear = ( elements, callback ) => {
	if ( ! ( 'IntersectionObserver' in window ) ) {
		elements.forEach( callback );
		return;
	}
	const observer = new IntersectionObserver( ( entries ) => entries.forEach( ( entry ) => {
		if ( entry.isIntersecting ) {
			observer.unobserve( entry.target );
			callback( entry.target );
		}
	} ), { rootMargin: '300px 0px' } );
	elements.forEach( ( el ) => observer.observe( el ) );
};

// each element once, a later boot only picks up the new ones
const boot = () => {
	const all = [ ...document.querySelectorAll( SELECTOR ) ].filter( ( el ) => ! el.alslSeen );
	all.forEach( ( el ) => {
		el.alslSeen = true;
		const config = configOf( el );
		// the editor's list and classes are React's: the block sets them itself
		if ( config && ! config.editor ) {
			addPlaces( el, config );
			if ( openMode( config ) && timed( el ) ) {
				showHours( el, config );
			}
			const look = lookOf( config.look );
			el.classList.add( ...look.className.split( ' ' ) );
			Object.entries( look.style ).forEach( ( [ name, value ] ) => el.style.setProperty( name, value ) );
		}
		// sent by the block editor's preview
		el.addEventListener( 'alsl:update', () => sync( el ) );
		el.addEventListener( 'alsl:destroy', () => close( el ) );
	} );
	whenNear( all, sync );
};

if ( 'loading' === document.readyState ) {
	document.addEventListener( 'DOMContentLoaded', boot );
} else {
	boot();
}

// for locators added to the page later, e.g. in a popup, and for the block editor
document.addEventListener( 'alsl:boot', boot );
