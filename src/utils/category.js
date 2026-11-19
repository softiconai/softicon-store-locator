// store categories, for the visitors' filter (src/map/search.js) and the editor

// "Café" and "cafe" are the same: accents and case do not matter
export const fold = ( value ) => String( value ).normalize( 'NFD' ).replace( /[̀-ͯ]/g, '' ).toLowerCase();

// "Bakery, Café" => [ 'Bakery', 'Café' ]
export const categoriesOf = ( value ) => String( value || '' ).split( ',' ).map( ( name ) => name.trim() ).filter( Boolean );

// every category of these stores' values once, in the first spelling met, sorted
export const categoryList = ( values ) => {
	const seen = new Map();
	values.forEach( ( value ) => categoriesOf( value ).forEach( ( name ) => seen.has( fold( name ) ) || seen.set( fold( name ), name ) ) );
	return [ ...seen.values() ].sort( ( a, b ) => a.localeCompare( b ) );
};

// does a store's value have this category (folded)?
export const inCategory = ( value, key ) => ! key || categoriesOf( value ).some( ( name ) => fold( name ) === key );

// the filter's look, as the categoryFilter attribute names it; '' is off
export const filterOf = ( value ) => ( [ 'select', 'buttons' ].includes( value ) ? value : '' );
