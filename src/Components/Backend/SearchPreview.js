import { __ } from '@wordpress/i18n';
import { distanceLabel } from '../../utils/options';

// what the page's search (src/map/search.js) looks like; it does nothing in the editor, where React owns the list
const SearchPreview = ( { attributes } ) => {
	const { nearMe, geocodeSearch, units, radius } = attributes;
	// as the page: Near me only on https, the radius only with a starting place
	const near = nearMe && window.isSecureContext;
	const first = Number.isInteger( radius ) && radius > 0 ? radius : 0;
	const unit = distanceLabel( first, units );

	return <div className="alsl_search" aria-hidden="true">
		<input type="search" className="alsl_query" placeholder={ __( 'Town, postcode or store name', 'softicon-store-locator' ) } readOnly tabIndex={ -1 } />
		<span className="alsl_go wp-element-button">{ __( 'Search', 'softicon-store-locator' ) }</span>
		{ near && <span className="alsl_near wp-element-button">{ __( 'Near me', 'softicon-store-locator' ) }</span> }
		{ ( geocodeSearch || near ) && <select className="alsl_radius" tabIndex={ -1 } value="x" onChange={ () => {} }>
			<option value="x">{ first ? unit : __( 'Any distance', 'softicon-store-locator' ) }</option>
		</select> }
	</div>;
};

export default SearchPreview;
