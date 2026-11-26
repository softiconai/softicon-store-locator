import { badgeOf, hasHours, nowIn, parseSchedule } from '../utils/hours';

// the open/closed badge of each store with opening times, kept right minute by minute;
// alsl:tick tells the "Open now" filter (src/map/search.js) to look again
export default ( el, config, text ) => {
	const lang = document.documentElement.lang;
	const stores = [ ...el.querySelectorAll( '.alsl_store' ) ]
		.map( ( item ) => ( { item, week: parseSchedule( item.dataset.open ) } ) )
		.filter( ( { week } ) => hasHours( week ) );
	if ( ! stores.length ) {
		return;
	}
	const paint = () => {
		const now = nowIn( config.tz );
		stores.forEach( ( { item, week } ) => {
			const badge = badgeOf( week, now, text, lang );
			let span = item.querySelector( '.alsl_open' );
			if ( ! badge ) {
				span?.remove();
				return;
			}
			if ( ! span ) {
				span = document.createElement( 'span' );
				const name = item.querySelector( '.alsl_name' );
				if ( name ) {
					name.after( span );
				} else {
					item.querySelector( '.alsl_info' )?.prepend( span );
				}
			}
			span.className = 'alsl_open ' + ( badge.open ? 'alsl_is_open' : 'alsl_is_closed' );
			span.textContent = badge.label;
		} );
		el.dispatchEvent( new window.CustomEvent( 'alsl:tick' ) );
	};
	paint();
	// at the start of each minute
	const next = () => setTimeout( () => {
		if ( el.isConnected ) {
			paint();
			next();
		}
	}, 60050 - ( Date.now() % 60000 ) );
	next();
};
