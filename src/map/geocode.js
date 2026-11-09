// Address to place, with Nominatim (OpenStreetMap) or another geocoder of the same kind (alsl_config 'geocoder').
// Nominatim's rules: at most one request a second, only when a person asks, never as autocomplete.

export const nominatim = 'https://nominatim.openstreetmap.org/search';

export const geocoderOf = ( url ) => ( 'string' === typeof url && /^https:\/\/[^\s"'<>]+$/.test( url ) ? url : nominatim );

// one request a second for the whole page, however many forms or batches ask
let next = 0;
const turn = () => {
	const now = Date.now();
	const wait = Math.max( 0, next - now );
	next = now + wait + 1100;
	return new Promise( ( resolve ) => setTimeout( resolve, wait ) );
};

// the text to look for: street, postcode and town, country
export const queryOf = ( store ) => [ store.address, [ store.postcode, store.city ].filter( Boolean ).join( ' ' ), store.country ]
	.map( ( part ) => ( 'string' === typeof part ? part.trim() : '' ) )
	.filter( Boolean )
	.join( ', ' );

const round = ( value ) => Math.round( Number( value ) * 1e6 ) / 1e6;

// { lat, lng, label } or null; Nominatim's JSON and Photon's GeoJSON are both read
export const geocode = async ( query, { url, lang, signal, bounds } = {} ) => {
	if ( ! query ) {
		return null;
	}
	await turn();
	if ( signal?.aborted ) {
		throw new DOMException( 'Aborted', 'AbortError' );
	}
	const address = new URL( geocoderOf( url ) );
	address.searchParams.set( 'q', query );
	address.searchParams.set( 'format', 'jsonv2' );
	address.searchParams.set( 'limit', '1' );
	if ( lang ) {
		address.searchParams.set( 'accept-language', lang );
	}
	// places in this area (west, north, east, south) come first, others still count
	if ( bounds ) {
		address.searchParams.set( 'viewbox', bounds.map( ( v ) => v.toFixed( 4 ) ).join( ',' ) );
	}
	const response = await fetch( address.href, { signal, credentials: 'omit' } );
	if ( ! response.ok ) {
		throw new Error( 'Geocoder: HTTP ' + response.status );
	}
	const data = await response.json();
	const hit = Array.isArray( data ) ? data[ 0 ] : data?.features?.[ 0 ];
	if ( ! hit ) {
		return null;
	}
	const [ lng, lat ] = hit.geometry?.coordinates || [ hit.lon, hit.lat ];
	const place = { lat: round( lat ), lng: round( lng ), label: String( hit.display_name || hit.properties?.name || '' ) };
	return Number.isFinite( place.lat ) && Number.isFinite( place.lng ) ? place : null;
};

// a store's place, trying less each time: the full address, then without the postcode (a street with a
// postcode often fails), then (only when `near` is allowed) the town alone. Each try is one request.
// Gives { lat, lng, label, near, loose } or null; loose: found without the postcode, so maybe the wrong street.
export const findPlace = async ( store, options = {} ) => {
	const tries = [ { query: queryOf( store ) } ];
	if ( store.postcode && store.address ) {
		tries.push( { query: queryOf( { ...store, postcode: '' } ) } );
	}
	if ( options.near && store.address ) {
		tries.push( { query: queryOf( { ...store, address: '' } ), near: true } );
	}
	const seen = new Set();
	for ( let i = 0; i < tries.length; i++ ) {
		const { query, near } = tries[ i ];
		if ( query && ! seen.has( query ) ) {
			seen.add( query );
			const hit = await geocode( query, options );
			if ( hit ) {
				return { ...hit, near: !! near, loose: i > 0 && ! near };
			}
		}
	}
	return null;
};
