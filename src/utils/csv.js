import { __ } from '@wordpress/i18n';

// the store fields a CSV file can fill, and the column names that mean them (lower case, spaces for _ - .)
export const csvFields = [
	{ key: 'name', label: __( 'Name', 'softicon-store-locator' ), names: [ 'name', 'store', 'store name', 'shop', 'shop name', 'outlet', 'company', 'business', 'business name', 'title', 'location', 'location name', 'branch', 'branch name', 'dealer', 'dealer name', 'retailer', 'stockist' ] },
	{ key: 'address', label: __( 'Address', 'softicon-store-locator' ), names: [ 'address', 'street', 'street address', 'address 1', 'address1', 'address line 1', 'addr', 'adresse', 'strasse', 'straße' ] },
	{ key: 'city', label: __( 'Town or city', 'softicon-store-locator' ), names: [ 'city', 'town', 'locality', 'suburb', 'place', 'town city', 'ort', 'ville', 'stadt' ] },
	{ key: 'postcode', label: __( 'Postcode', 'softicon-store-locator' ), names: [ 'postcode', 'post code', 'postal code', 'postalcode', 'zip', 'zip code', 'zipcode', 'plz' ] },
	{ key: 'country', label: __( 'Country', 'softicon-store-locator' ), names: [ 'country', 'country name', 'country code', 'land', 'pays' ] },
	{ key: 'phone', label: __( 'Phone', 'softicon-store-locator' ), names: [ 'phone', 'telephone', 'tel', 'phone number', 'mobile', 'telefon', 'telephone number' ] },
	{ key: 'email', label: __( 'Email', 'softicon-store-locator' ), names: [ 'email', 'e mail', 'mail', 'email address' ] },
	{ key: 'website', label: __( 'Website', 'softicon-store-locator' ), names: [ 'website', 'url', 'web', 'site', 'homepage', 'web site' ] },
	{ key: 'hours', label: __( 'Opening hours', 'softicon-store-locator' ), names: [ 'hours', 'opening hours', 'opening times', 'open', 'business hours' ] },
	{ key: 'lat', label: __( 'Latitude', 'softicon-store-locator' ), names: [ 'lat', 'latitude' ] },
	{ key: 'lng', label: __( 'Longitude', 'softicon-store-locator' ), names: [ 'lng', 'lon', 'long', 'longitude' ] },
	{ key: 'imageUrl', label: __( 'Image address', 'softicon-store-locator' ), names: [ 'image', 'image url', 'photo', 'picture', 'imageurl' ] },
];

const plain = ( name ) => String( name ).toLowerCase().replace( /[_\-.]+/g, ' ' ).replace( /\s+/g, ' ' ).trim();

// field => the file's column for it, or ''
export const guessColumns = ( headers ) => {
	const found = {};
	csvFields.forEach( ( { key, names } ) => {
		found[ key ] = headers.find( ( header ) => names.includes( plain( header ) ) ) || '';
	} );
	return found;
};

// a new store id: what sanitize_key() keeps
export const newId = () => 's' + Math.random().toString( 36 ).slice( 2, 10 );

// "51,4545" from a spreadsheet with a decimal comma
const number = ( value ) => ( /^\s*-?\d+,\d+\s*$/.test( value ) ? value.replace( ',', '.' ) : value ).trim();

// the file's rows as stores; rows with no name, address or town are left out
export const rowsToStores = ( rows, columns ) => rows.map( ( row ) => {
	const store = { id: newId() };
	csvFields.forEach( ( { key } ) => {
		const value = columns[ key ] && null !== row[ columns[ key ] ] && undefined !== row[ columns[ key ] ] ? String( row[ columns[ key ] ] ) : '';
		if ( value.trim() ) {
			// the ' that storesToCsv() put before a cell starting with = @ + or -
			const cell = value.trim().replace( /^'(?=[=@+\-])/, '' );
			store[ key ] = 'lat' === key || 'lng' === key ? number( cell ) : cell;
		}
	} );
	return store;
} ).filter( ( store ) => store.name || store.address || store.city );

// a cell a spreadsheet would run as a formula gets a ' in front; phone numbers like +44 117 stay as they are
const cell = ( value ) => {
	let text = null === value || undefined === value ? '' : String( value );
	if ( /^[=@\t\r]/.test( text ) || ( /^[+-]/.test( text ) && ! /^[+-][\d\s().\/-]*$/.test( text ) ) ) {
		text = "'" + text;
	}
	return /[",\n\r]/.test( text ) ? '"' + text.replace( /"/g, '""' ) + '"' : text;
};

// UTF-8 with a BOM, so Excel reads the accents
export const storesToCsv = ( stores ) => '\ufeff' + [
	csvFields.map( ( field ) => field.key ),
	...stores.map( ( store ) => csvFields.map( ( field ) => store?.[ field.key ] ) ),
].map( ( row ) => row.map( cell ).join( ',' ) ).join( '\r\n' ) + '\r\n';

export const download = ( name, text ) => {
	const url = URL.createObjectURL( new window.Blob( [ text ], { type: 'text/csv;charset=utf-8' } ) );
	const link = document.createElement( 'a' );
	link.href = url;
	link.download = name;
	document.body.append( link );
	link.click();
	link.remove();
	setTimeout( () => URL.revokeObjectURL( url ), 1000 );
};
