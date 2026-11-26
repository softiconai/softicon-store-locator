import { distance, radii } from './distance';
import { findPlace } from './geocode';
import { categoryList, filterOf, fold, inCategory } from '../utils/category';
import { hasHours, nowIn, openModeOf, parseSchedule, statusOf } from '../utils/hours';

// "Bristol", "bs1", "BS11JQ" or "café": accents and case do not matter (fold), nor the spaces in a postcode
const squash = ( value ) => value.replace( /[\s\-.,]+/g, '' );

// the stores shown, as one string (ids are sanitize_key() output: no commas)
const keyOf = ( items ) => items.map( ( item ) => item.dataset.id ).join();

// what a visitor can search in a store: its text and categories, not the open/closed badge or the distance
const hayOf = ( item ) => {
	const info = item.querySelector( '.alsl_info' )?.cloneNode( true );
	info?.querySelectorAll( '.alsl_open, .alsl_distance' ).forEach( ( node ) => node.remove() );
	return fold( ( info?.textContent || '' ) + ' ' + ( item.dataset.cat || '' ) );
};

// the search above a block's map and list: the stores in the list first (no request), then the address on the
// map service (only when the visitor presses Search), then "Near me" (the location stays in the browser);
// and the category and "Open now" filters, which only narrow what the list shows and never ask the map service
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
		this.kind = filterOf( config.cat );
		this.categories = this.kind ? categoryList( this.items.map( ( item ) => item.dataset.cat ) ) : [];
		this.cat = '';
		this.query = '';
		this.weeks = new Map( this.items.map( ( item ) => [ item, parseSchedule( item.dataset.open ) ] ) );
		this.timed = 'filter' === openModeOf( config.look?.openNow ) && [ ...this.weeks.values() ].some( hasHours );
		this.openOnly = false;
	}

	// the stores in the chosen category, and open now when the visitor asks
	pool() {
		const now = this.openOnly && nowIn( this.config.tz );
		return this.items.filter( ( item ) => inCategory( item.dataset.cat, this.cat ) && ( ! now || statusOf( this.weeks.get( item ), now )?.open ) );
	}

	// a filter changed: what is shown now, again
	refresh() {
		// a place lookup on its way: its answer is sorted with the new filter
		if ( this.lookup ) {
			return;
		}
		this.openKey = keyOf( this.pool() );
		if ( this.origin ) {
			this.sortFrom( this.origin );
		} else if ( this.query ) {
			this.find( this.query, true );
		} else {
			this.showAll();
		}
	}

	// "Open now": a button that stays pressed; the badges' minute (alsl:tick) may open or close stores
	openToggle() {
		const chip = Object.assign( document.createElement( 'button' ), { type: 'button', className: 'alsl_chip alsl_open_only', textContent: this.text.openNow } );
		chip.setAttribute( 'aria-pressed', 'false' );
		chip.addEventListener( 'click', () => {
			this.openOnly = ! this.openOnly;
			chip.setAttribute( 'aria-pressed', String( this.openOnly ) );
			this.refresh();
		} );
		this.el.addEventListener( 'alsl:tick', () => {
			// only when the open stores changed, so a list being read does not jump
			if ( this.openOnly && this.openKey !== keyOf( this.pool() ) ) {
				this.refresh();
			}
		} );
		return chip;
	}

	// a drop-down list or a row of buttons; a choice applies to what is shown now
	filter() {
		const t = this.text;
		const pick = ( name ) => {
			this.cat = name ? fold( name ) : '';
			this.refresh();
		};
		if ( 'select' === this.kind ) {
			const select = document.createElement( 'select' );
			select.className = 'alsl_cat';
			select.setAttribute( 'aria-label', t.category );
			select.append( new Option( t.allCategories, '' ), ...this.categories.map( ( name ) => new Option( name, name ) ) );
			select.addEventListener( 'change', () => pick( select.value ) );
			return select;
		}
		// the row; "Open now" may join it
		const row = document.createElement( 'div' );
		row.className = 'alsl_cats';
		const group = document.createElement( 'div' );
		group.className = 'alsl_catgroup';
		group.setAttribute( 'role', 'group' );
		group.setAttribute( 'aria-label', t.category );
		const buttons = [ '', ...this.categories ].map( ( name ) => {
			const chip = Object.assign( document.createElement( 'button' ), { type: 'button', className: 'alsl_chip', textContent: name || t.allCategories } );
			chip.setAttribute( 'aria-pressed', String( ! name ) );
			chip.addEventListener( 'click', () => {
				buttons.forEach( ( other ) => other.setAttribute( 'aria-pressed', String( other === chip ) ) );
				pick( name );
			} );
			return chip;
		} );
		group.append( ...buttons );
		row.append( group );
		return row;
	}

	init() {
		const t = this.text;
		const form = document.createElement( 'form' );
		form.className = 'alsl_search';
		const search = !! this.config.search;
		// a filter alone is no search box
		if ( search ) {
			form.setAttribute( 'role', 'search' );
		}
		form.setAttribute( 'aria-label', search ? t.find : t.category );
		if ( ! search && this.categories.length < 2 ) {
			form.setAttribute( 'aria-label', t.openNow );
		}
		form.noValidate = true;
		const input = Object.assign( document.createElement( 'input' ), { type: 'search', className: 'alsl_query', placeholder: t.placeholder, autocomplete: 'off' } );
		input.setAttribute( 'aria-label', t.find );
		input.setAttribute( 'enterkeyhint', 'search' );
		const button = ( label, cls, type = 'button' ) => Object.assign( document.createElement( 'button' ), { type, className: cls + ' wp-element-button', textContent: label } );
		const parts = search ? [ input, button( t.search, 'alsl_go', 'submit' ) ] : [];
		// distances need stores with a place: without one, only the list is searched
		const placed = this.items.some( ( item ) => item.dataset.lat && item.dataset.lng );
		this.geo = search && !! this.config.geo && placed;
		// the browser asks the visitor; it works only on https
		const near = search && !! this.config.near && placed && window.isSecureContext && !! navigator.geolocation;
		if ( near ) {
			const nearButton = button( t.nearMe, 'alsl_near' );
			nearButton.addEventListener( 'click', () => this.nearMe() );
			parts.push( nearButton );
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
		// the radius counts only from a place found or the visitor's location
		if ( this.geo || near ) {
			parts.push( radius );
		}
		// with two categories or more
		const filter = this.categories.length > 1 ? this.filter() : null;
		if ( filter ) {
			parts.push( filter );
		}
		// with opening times; in the category buttons' row when there is one
		if ( this.timed ) {
			const toggle = this.openToggle();
			if ( filter?.classList.contains( 'alsl_cats' ) ) {
				filter.append( toggle );
			} else {
				parts.push( toggle );
			}
		}
		// nothing to show (opening times that can not be read, and no search)
		if ( ! parts.length ) {
			return;
		}
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
			this.query = '';
			this.showAll();
			if ( search ) {
				input.focus();
			}
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
		// a category alone needs no "Show all": the filter shows it
		this.reset.hidden = items.length === this.pool().length && ! origin;
		this.result.hidden = this.reset.hidden && ! this.status.textContent;
		this.el.alsl?.update();
	}

	showAll() {
		const pool = this.pool();
		this.show( pool );
		this.say( this.openOnly && ! pool.length ? this.text.noneOpen : '' );
	}

	// local: only the list (a new category for the last search), never the map service
	async find( query, local = false ) {
		this.query = query;
		if ( ! query ) {
			this.showAll();
			return;
		}
		this.abort?.abort();
		const words = fold( query ).split( /\s+/ ).filter( Boolean );
		const compact = squash( fold( query ) );
		const all = this.items.filter( ( item ) => {
			const hay = hayOf( item );
			return words.every( ( word ) => hay.includes( word ) ) || ( compact.length > 2 && squash( hay ).includes( compact ) );
		} );
		const pool = new Set( this.pool() );
		const matches = all.filter( ( item ) => pool.has( item ) );
		if ( matches.length ) {
			this.show( matches );
			this.say( this.text.matches( matches.length, query ) );
			return;
		}
		// a store the category or "Open now" hides: said here, never looked up on the map service
		if ( all.length ) {
			this.showAll();
			this.say( this.text.filtered( query ) );
			return;
		}
		// nothing in the list and no place lookup: every store stays, with the message
		if ( ! this.geo || local ) {
			this.showAll();
			this.say( this.text.notFound( query ) );
			return;
		}
		this.say( this.text.searching );
		const lookup = new window.AbortController();
		this.abort = lookup;
		this.lookup = lookup;
		try {
			const place = await findPlace( { address: query }, {
				url: this.config.geocoder,
				lang: document.documentElement.lang,
				bounds: this.bounds(),
				signal: lookup.signal,
			} );
			this.lookup = null;
			if ( place ) {
				this.sortFrom( { lat: place.lat, lng: place.lng, label: place.label.split( ',' )[ 0 ] || query } );
			} else {
				this.showAll();
				this.say( this.text.notFound( query ) );
			}
		} catch ( error ) {
			if ( this.lookup === lookup ) {
				this.lookup = null;
			}
			if ( 'AbortError' !== error.name ) {
				this.say( this.text.failed );
			}
		}
	}

	nearMe() {
		this.abort?.abort();
		this.lookup = null;
		this.say( this.text.locating );
		navigator.geolocation.getCurrentPosition(
			( position ) => {
				this.input.value = '';
				this.query = '';
				this.sortFrom( { lat: position.coords.latitude, lng: position.coords.longitude, label: this.text.you, you: true } );
			},
			() => this.say( this.text.noLocation ),
			{ enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
		);
	}

	// the stores by distance from a place: those within the radius, or the nearest three when none is
	sortFrom( origin ) {
		const placed = this.pool()
			.filter( ( item ) => item.dataset.lat && item.dataset.lng )
			.map( ( item ) => ( { item, km: distance( origin, { lat: Number( item.dataset.lat ), lng: Number( item.dataset.lng ) }, this.units ) } ) )
			.sort( ( a, b ) => a.km - b.km );
		const within = this.radius ? placed.filter( ( p ) => p.km <= this.radius ) : placed;
		const shown = within.length ? within : placed.slice( 0, 3 );
		// a category with no store on the map
		if ( ! shown.length ) {
			this.show( this.pool(), origin );
			this.say( this.pool().length ? this.text.unplaced : this.text.noneOpen );
			return;
		}
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
