import { __ } from '@wordpress/i18n';
import { distanceLabel } from '../../utils/options';
import { categoryList, filterOf } from '../../utils/category';
import { hasHours, openModeOf, parseSchedule } from '../../utils/hours';

// the categories the page's filter would offer, or none
export const filterCategories = ( attributes, stores ) => ( filterOf( attributes.categoryFilter ) ? categoryList( stores.map( ( store ) => store.category ) ) : [] );

// the "Open now" button: on, and a store with opening times
export const openFilterShown = ( attributes, stores ) => 'filter' === openModeOf( attributes.openNow ) && stores.some( ( store ) => hasHours( parseSchedule( store.schedule ) ) );

// what the page's search (src/map/search.js) looks like; it does nothing in the editor, where React owns the list
const SearchPreview = ( { attributes, stores } ) => {
	const { search, nearMe, geocodeSearch, units, radius, categoryFilter } = attributes;
	// as the page: Near me and place lookup only with a store on the map, Near me only on https
	const placed = stores.some( ( store ) => null !== store.lat );
	const near = search && placed && nearMe && window.isSecureContext;
	const first = Number.isInteger( radius ) && radius > 0 ? radius : 0;
	const unit = distanceLabel( first, units );
	const categories = filterCategories( attributes, stores );
	const all = __( 'All categories', 'softicon-store-locator' );
	const open = openFilterShown( attributes, stores ) && <span className="alsl_chip alsl_open_only" aria-pressed="false">{ __( 'Open now', 'softicon-store-locator' ) }</span>;

	return <div className="alsl_search" aria-hidden="true">
		{ search && <>
			<input type="search" className="alsl_query" placeholder={ __( 'Town, postcode or store name', 'softicon-store-locator' ) } readOnly tabIndex={ -1 } />
			<span className="alsl_go wp-element-button">{ __( 'Search', 'softicon-store-locator' ) }</span>
		</> }
		{ near && <span className="alsl_near wp-element-button">{ __( 'Near me', 'softicon-store-locator' ) }</span> }
		{ ( ( search && placed && geocodeSearch ) || near ) && <select className="alsl_radius" tabIndex={ -1 } value="x" onChange={ () => {} }>
			<option value="x">{ first ? unit : __( 'Any distance', 'softicon-store-locator' ) }</option>
		</select> }
		{ categories.length > 1 && ( 'select' === categoryFilter
			? <select className="alsl_cat" tabIndex={ -1 } value="x" onChange={ () => {} }>
				<option value="x">{ all }</option>
			</select>
			: <div className="alsl_cats">
				{ [ all, ...categories ].map( ( name, i ) => <span key={ name } className="alsl_chip" aria-pressed={ String( ! i ) }>{ name }</span> ) }
				{ open }
			</div> ) }
		{ ( categories.length < 2 || 'select' === categoryFilter ) && open }
	</div>;
};

export default SearchPreview;
