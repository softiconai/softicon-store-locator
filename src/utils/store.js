// the editor's copy of Block::store() in includes/class-block.php: what the page will show for a store

// one-line text fields of a store; the same list is in includes/class-block.php (TEXT)
export const textFields = [ 'name', 'address', 'city', 'postcode', 'country' ];

// like wp_strip_all_tags(): tags go, and so does what is inside script and style
const strip = ( value ) => value.replace( /<(script|style)[^>]*?>[\s\S]*?<\/\1>/gi, '' ).replace( /<[^>]*>/g, '' );

const text = ( value ) => ( 'string' === typeof value || 'number' === typeof value ? strip( String( value ) ).trim() : '' );

// a number in -max..max, or null
export const coord = ( value, max ) => {
	const number = 'string' === typeof value && '' !== value.trim() ? Number( value ) : value;
	return 'number' === typeof number && Number.isFinite( number ) && Math.abs( number ) <= max ? number : null;
};

// a http(s) address, or ''
export const link = ( value ) => {
	try {
		const url = new URL( text( value ) );
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

// null when the store has nothing to show, as on the page
export const cleanStore = ( raw, index ) => {
	if ( ! raw || 'object' !== typeof raw ) {
		return null;
	}
	const store = { id: text( raw.id ) || 's' + index };
	textFields.forEach( ( key ) => {
		store[ key ] = text( raw[ key ] );
	} );
	Object.assign( store, {
		phone: text( raw.phone ).replace( /[^0-9+\-().\/\s]/g, '' ),
		email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( text( raw.email ) ) ? text( raw.email ) : '',
		website: link( raw.website ),
		hours: text( raw.hours ),
		image: link( raw.imageUrl ),
		lat: coord( raw.lat, 90 ),
		lng: coord( raw.lng, 180 ),
	} );
	return store.name || store.address || store.city ? store : null;
};
