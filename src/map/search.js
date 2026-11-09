import { distance, radii } from './distance';
import { findPlace } from './geocode';

// "Bristol", "bs1", "BS11JQ" or "café": accents and case do not matter, nor the spaces in a postcode
const fold = ( value ) => value.normalize( 'NFD' ).replace( /[̀-ͯ]/g, '' ).toLowerCase();
const squash = ( value ) => value.replace( /[\s\-.,]+/g, '' );

// the search above a block's map and list: the stores in the list first (no request), then the address on the
// map service (only when the visitor presses Search), then "Near me" (the location stays in the browser)
export default class Finder {
	constructor( el, config, text ) {
		this.el = el;
		this.config = config;
		this.text = text;
		this.list = el.querySelector( '.alsl_list' );
		this.items = [ ...this.list.querySelectorAll( '.alsl_store' ) ];
		this.units = 'mi' === config.units ? 'mi' : 'km';
		this.radius = Number.isInteger( config.radius ) && config.radius > 0 && config.radius <= 20000 ? config.radius : 0;
		this.number = new Intl.NumberFormat( document.documentElement.lang || undefined, { maximumFractionDigits: 1 } );
	}

	init() {
		const t = this.text;
		const form = document.createElement( 'form' );
		form.className = 'alsl_search';
		form.setAttribute( 'role', 'search' );
		form.setAttribute( 'aria-label', t.find );
		form.noValidate = true;
		const input = Object.assign( document.createElement( 'input' ), { type: 'search', className: 'alsl_query', placeholder: t.placeholder, autocomplete: 'off' } );
		input.setAttribute( 'aria-label', t.find );
		input.setAttribute( 'enterkeyhint', 'search' );
		const button = ( label, cls, type = 'button' ) => Object.assign( document.createElement( 'button' ), { type, className: cls + ' wp-element-button', textContent: label } );
		const parts = [ input, button( t.search, 'alsl_go', 'submit' ) ];
		// the browser asks the visitor; it works only on https
		if ( this.config.near && window.isSecureContext && navigator.geolocation ) {
			const near = button( t.nearMe, 'alsl_near' );
			near.addEventListener( 'click', () => this.nearMe() );
			parts.push( near );
		}
		const radius = document.createElement( 'select' );
		radius.className = 'alsl_radius';
		radius.setAttribute( 'aria-label', t.distance );
		[ ...new Set( [ ...radii, this.radius ] ) ].sort( ( a, b ) => a - b ).forEach( ( r ) => radius.append( new Option( r ? t[ this.units ]( r ) : t.any, r, false, r === this.radius ) ) );
		radius.addEventListener( 'change', () => {
			this.radius = Number( radius.value );
			if ( this.origin ) {
				this.sortFrom( this.origin );
			}
		} );
		parts.push( radius );
		// the result line: what is shown, and "Show all" to go back
		this.result = document.createElement( 'div' );
		this.result.className = 'alsl_result';
		this.result.hidden = true;
		this.status = document.createElement( 'p' );
		this.status.className = 'alsl_status';
		this.status.setAttribute( 'role', 'status' );
		this.reset = Object.assign( document.createElement( 'button' ), { type: 'button', className: 'alsl_all', textContent: t.all, hidden: true } );
		this.reset.addEventListener( 'click', () => {
			input.value = '';
			this.showAll();
			input.focus();
		} );
		this.result.append( this.status, this.reset );
		form.append( ...parts, this.result );
		form.addEventListener( 'submit', ( event ) => {
			event.preventDefault();
			this.find( input.value.trim() );
		} );
		this.input = input;
		this.el.prepend( form );
	}

	say( message ) {
		this.status.textContent = message;
		this.result.hidden = ! message && this.reset.hidden;
	}

	// the stores the list shows, in this order, and where the search started; the map follows
	show( items, origin = null ) {
		this.origin = origin;
		this.el.alslOrigin = origin;
		const shown = new Set( items );
		this.items.forEach( ( item ) => {
			item.hidden = ! shown.has( item );
			item.querySelector( '.alsl_distance' )?.remove();
		} );
		this.list.append( ...items, ...this.items.filter( ( item ) => ! shown.has( item ) ) );
		this.list.scrollTop = 0;
		this.reset.hidden = items.length === this.items.length && ! origin;
		this.result.hidden = this.reset.hidden && ! this.status.textContent;
		this.el.alsl?.update();
	}

	showAll() {
		this.show( this.items );
		this.say( '' );
	}

	async find( query ) {
		if ( ! query ) {
			this.showAll();
			return;
		}
		this.abort?.abort();
		const words = fold( query ).split( /\s+/ ).filter( Boolean );
		const compact = squash( fold( query ) );
		const matches = this.items.filter( ( item ) => {
			const hay = fold( item.querySelector( '.alsl_info' )?.textContent || '' );
			return words.every( ( word ) => hay.includes( word ) ) || ( compact.length > 2 && squash( hay ).includes( compact ) );
		} );
		if ( matches.length || ! this.config.geo ) {
			this.show( matches );
			this.say( matches.length ? this.text.matches( matches.length, query ) : this.text.notFound( query ) );
			return;
		}
		this.say( this.text.searching );
		this.abort = new window.AbortController();
		try {
			const place = await findPlace( { address: query }, {
				url: this.config.geocoder,
				lang: document.documentElement.lang,
				bounds: this.bounds(),
				signal: this.abort.signal,
			} );
			if ( place ) {
				this.sortFrom( { lat: place.lat, lng: place.lng, label: place.label.split( ',' )[ 0 ] || query } );
			} else {
				this.showAll();
				this.say( this.text.notFound( query ) );
			}
		} catch ( error ) {
			if ( 'AbortError' !== error.name ) {
				this.say( this.text.failed );
			}
		}
	}

	nearMe() {
		this.abort?.abort();
		this.say( this.text.locating );
		navigator.geolocation.getCurrentPosition(
			( position ) => {
				this.input.value = '';
				this.sortFrom( { lat: position.coords.latitude, lng: position.coords.longitude, label: this.text.you, you: true } );
			},
			() => this.say( this.text.noLocation ),
			{ enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
		);
	}

	// the stores by distance from a place: those within the radius, or the nearest three when none is
	sortFrom( origin ) {
		const placed = this.items
			.filter( ( item ) => item.dataset.lat && item.dataset.lng )
			.map( ( item ) => ( { item, km: distance( origin, { lat: Number( item.dataset.lat ), lng: Number( item.dataset.lng ) }, this.units ) } ) )
			.sort( ( a, b ) => a.km - b.km );
		const within = this.radius ? placed.filter( ( p ) => p.km <= this.radius ) : placed;
		const shown = within.length ? within : placed.slice( 0, 3 );
		this.show( shown.map( ( p ) => p.item ), origin );
		shown.forEach( ( { item, km } ) => {
			const label = document.createElement( 'span' );
			label.className = 'alsl_distance';
			label.textContent = this.text[ this.units ]( this.number.format( km < 10 ? km : Math.round( km ) ) );
			item.querySelector( '.alsl_info' )?.prepend( label );
		} );
		const radius = this.text[ this.units ]( this.radius );
		if ( ! this.radius ) {
			this.say( this.text.nearest( origin.label ) );
		} else {
			this.say( within.length ? this.text.within( within.length, radius, origin.label ) : this.text.none( radius, origin.label ) );
		}
	}

	// the area of the stores, so the map service prefers places there ("Springfield" near the stores)
	bounds() {
		const lats = [];
		const lngs = [];
		this.items.forEach( ( item ) => {
			if ( item.dataset.lat ) {
				lats.push( Number( item.dataset.lat ) );
				lngs.push( Number( item.dataset.lng ) );
			}
		} );
		if ( ! lats.length ) {
			return null;
		}
		const pad = ( a, b ) => Math.max( 1, ( b - a ) / 2 );
		const [ south, north, west, east ] = [ Math.min( ...lats ), Math.max( ...lats ), Math.min( ...lngs ), Math.max( ...lngs ) ];
		return [ west - pad( west, east ), north + pad( south, north ), east + pad( west, east ), south - pad( south, north ) ]
			.map( ( v, i ) => Math.max( i % 2 ? -90 : -180, Math.min( i % 2 ? 90 : 180, v ) ) );
	}
}
