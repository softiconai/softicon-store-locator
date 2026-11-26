import { __, _n, sprintf } from '@wordpress/i18n';

// the map's and the search's text: WordPress translates view.js, not the lazy chunks, so view.js passes this to them
export const text = {
	show: __( 'Show map', 'softicon-store-locator' ),
	consent: __( 'The map is loaded from OpenStreetMap, which then receives your IP address.', 'softicon-store-locator' ),
	zoomIn: __( 'Zoom in', 'softicon-store-locator' ),
	zoomOut: __( 'Zoom out', 'softicon-store-locator' ),
	directions: __( 'Directions', 'softicon-store-locator' ),
	find: __( 'Find a store', 'softicon-store-locator' ),
	placeholder: __( 'Town, postcode or store name', 'softicon-store-locator' ),
	search: __( 'Search', 'softicon-store-locator' ),
	nearMe: __( 'Near me', 'softicon-store-locator' ),
	all: __( 'Show all', 'softicon-store-locator' ),
	distance: __( 'Distance', 'softicon-store-locator' ),
	any: __( 'Any distance', 'softicon-store-locator' ),
	category: __( 'Category', 'softicon-store-locator' ),
	allCategories: __( 'All categories', 'softicon-store-locator' ),
	unplaced: __( 'No store in this category is on the map yet.', 'softicon-store-locator' ),
	openNow: __( 'Open now', 'softicon-store-locator' ),
	noneOpen: __( 'No store is open now.', 'softicon-store-locator' ),
	// translators: %s: what the visitor searched for
	filtered: ( query ) => sprintf( __( 'No store matches “%s” with the filters you chose.', 'softicon-store-locator' ), query ),
	// translators: %s: a time, like 18:00 or Sat 8:00
	openUntil: ( time ) => sprintf( __( 'Open until %s', 'softicon-store-locator' ), time ),
	// translators: %s: a time, like 9:00 or Mon 9:00
	opens: ( time ) => sprintf( __( 'Closed · opens %s', 'softicon-store-locator' ), time ),
	searching: __( 'Searching…', 'softicon-store-locator' ),
	locating: __( 'Finding your location…', 'softicon-store-locator' ),
	you: __( 'your location', 'softicon-store-locator' ),
	noLocation: __( 'Your location could not be found. Type your town or postcode instead.', 'softicon-store-locator' ),
	failed: __( 'The search did not work. Try again in a moment.', 'softicon-store-locator' ),
	// translators: %s: a distance number
	km: ( n ) => sprintf( __( '%s km', 'softicon-store-locator' ), n ),
	// translators: %s: a distance number
	mi: ( n ) => sprintf( __( '%s mi', 'softicon-store-locator' ), n ),
	// translators: 1: number of stores, 2: what the visitor searched for
	matches: ( count, query ) => sprintf( _n( '%1$d store matches “%2$s”.', '%1$d stores match “%2$s”.', count, 'softicon-store-locator' ), count, query ),
	// translators: 1: number of stores, 2: a distance like "25 km", 3: a place, or "your location"
	within: ( count, radius, place ) => sprintf( _n( '%1$d store within %2$s of %3$s.', '%1$d stores within %2$s of %3$s.', count, 'softicon-store-locator' ), count, radius, place ),
	// translators: %s: a place, or "your location"
	nearest: ( place ) => sprintf( __( 'Stores nearest to %s.', 'softicon-store-locator' ), place ),
	// translators: 1: a distance like "25 km", 2: a place, or "your location"
	none: ( radius, place ) => sprintf( __( 'No store within %1$s of %2$s. The nearest ones are shown.', 'softicon-store-locator' ), radius, place ),
	// translators: %s: what the visitor searched for
	notFound: ( query ) => sprintf( __( 'Nothing was found for “%s”.', 'softicon-store-locator' ), query ),
};
