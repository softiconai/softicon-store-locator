// the editor's copy of Block::store() in includes/class-block.php: what the page will show for a store

// one-line text fields of a store; the same list is in includes/class-block.php (TEXT)
export const textFields = [ 'name', 'address', 'city', 'postcode', 'country' ];

// like wp_strip_all_tags(): tags go, and so does what is inside script and style
const strip = ( value ) => value.replace( /<(script|style)[^>]*?>[\s\S]*?<\/\1>/gi, '' ).replace( /<[^>]*>/g, '' );

export const text = ( value ) => ( 'string' === typeof value || 'number' === typeof value ? strip( String( value ) ).trim() : '' );

// a number in -max..max, or null; strings as PHP's is_numeric() takes them (no 0x1A, no 1,5)
export const coord = ( value, max ) => {
	const number = 'string' === typeof value && /^\s*[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?\s*$/i.test( value ) ? Number( value ) : value;
	return 'number' === typeof number && Number.isFinite( number ) && Math.abs( number ) <= max ? number : null;
};

// a http(s) address, or ''; like esc_url(), an address without a scheme gets http://
export const link = ( value ) => {
	const raw = text( value );
	if ( ! raw ) {
		return '';
	}
	// an address on the site itself, as esc_url() keeps it
	if ( /^[/#?]/.test( raw ) ) {
		return raw;
	}
	try {
		const url = new URL( /^[a-z][a-z0-9+.-]*:/i.test( raw ) ? raw : 'http://' + raw );
		return [ 'http:', 'https:' ].includes( url.protocol ) ? url.href : '';
	} catch ( e ) {
		return '';
	}
};

// a phone number as a tel: link, only + and digits
export const tel = ( phone ) => {
	const digits = text( phone ).replace( /[^0-9+]/g, '' );
	return digits.length > 2 ? 'tel:' + digits : '';
};

// a place needs a latitude and a longitude
export const placeOf = ( raw ) => {
	const lat = coord( raw?.lat, 90 );
	const lng = coord( raw?.lng, 180 );
	return null === lat || null === lng ? null : { lat, lng };
};

// null when the store has nothing to show, as on the page
export const cleanStore = ( raw, index ) => {
	if ( ! raw || 'object' !== typeof raw ) {
		return null;
	}
	// the id as sanitize_key() keeps it
	const store = { id: text( raw.id ).toLowerCase().replace( /[^a-z0-9_-]/g, '' ).slice( 0, 40 ) || 's' + index };
	// the lengths PHP keeps
	textFields.forEach( ( key ) => {
		store[ key ] = [ ...text( raw[ key ] ) ].slice( 0, 200 ).join( '' );
	} );
	Object.assign( store, {
		phone: text( raw.phone ).replace( /[^0-9+\-().\/\s]/g, '' ).trim().slice( 0, 40 ),
		// what is_email() takes: ASCII only
		email: /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test( text( raw.email ) ) ? text( raw.email ) : '',
		website: link( raw.website ),
		hours: [ ...text( raw.hours ) ].slice( 0, 500 ).join( '' ),
		image: link( raw.imageUrl ),
		lat: coord( raw.lat, 90 ),
		lng: coord( raw.lng, 180 ),
	} );
	// a place needs both
	if ( null === store.lat || null === store.lng ) {
		store.lat = store.lng = null;
	}
	return store.name || store.address || store.city ? store : null;
};
