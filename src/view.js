import './public-path';

const SELECTOR = '.alsl_locator';

// the stores the map shows, read back from render.php's list
const storesOf = ( el ) => [ ...el.querySelectorAll( '.alsl_store' ) ].map( ( item ) => ( {
	id: item.dataset.id,
	el: item,
	lat: '' === ( item.dataset.lat ?? '' ) ? null : Number( item.dataset.lat ),
	lng: '' === ( item.dataset.lng ?? '' ) ? null : Number( item.dataset.lng ),
} ) );

const start = ( el ) => {
	let config;
	try {
		config = JSON.parse( el.dataset.alsl || '{}' );
	} catch ( e ) {
		return;
	}
	// the map opens here, from its own chunk
	el.alsl = { config, stores: storesOf( el ) };
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
	} );
	whenNear( all, start );
};

if ( 'loading' === document.readyState ) {
	document.addEventListener( 'DOMContentLoaded', boot );
} else {
	boot();
}

// for locators added to the page later, e.g. in a popup
document.addEventListener( 'alsl:boot', boot );
