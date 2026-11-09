import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';
import { Panel, ToggleRow } from '../../../../vendor/softicon-tools/components/Panels';
import { radii } from '../../../../map/distance';
import { distanceLabel } from '../../../../utils/options';

const SearchPanel = ( { attributes, setAttributes } ) => {
	const { search, geocodeSearch, nearMe, units, radius, directions } = attributes;
	const set = ( key ) => ( value ) => setAttributes( { [ key ]: value } );
	const unit = ( n ) => distanceLabel( n, units );

	return <Panel id="search" title={ __( 'Search', 'softicon-store-locator' ) }>
		<ToggleRow
			label={ __( 'Search box', 'softicon-store-locator' ) }
			tip={ __( 'Visitors type a town, postcode or store name. Stores in your list are matched at once, without asking any service.', 'softicon-store-locator' ) }
			checked={ search }
			onChange={ set( 'search' ) }
		/>
		{ search && <>
			<ToggleRow
				label={ __( 'Look up other places', 'softicon-store-locator' ) }
				tip={ __( 'When nothing in your list matches, the place is looked up on OpenStreetMap (Nominatim) and the stores are sorted by distance from it. Only what the visitor typed is sent, when they press Search.', 'softicon-store-locator' ) }
				checked={ geocodeSearch }
				onChange={ set( 'geocodeSearch' ) }
			/>
			<ToggleRow
				label={ __( 'Near me button', 'softicon-store-locator' ) }
				tip={ __( 'Sorts the stores by distance from the visitor, with the location their browser gives. The location stays in the browser. Shown only on https sites.', 'softicon-store-locator' ) }
				checked={ nearMe }
				onChange={ set( 'nearMe' ) }
			/>
			{ nearMe && ! window.isSecureContext && <p className="alslHelp">{ __( 'This site is not on https, so visitors will not see the Near me button.', 'softicon-store-locator' ) }</p> }
			{ ( geocodeSearch || nearMe ) && <>
				<SelectControl
					label={ __( 'Distance unit', 'softicon-store-locator' ) }
					value={ units }
					options={ [
						{ value: 'km', label: __( 'Kilometres', 'softicon-store-locator' ) },
						{ value: 'mi', label: __( 'Miles', 'softicon-store-locator' ) },
					] }
					onChange={ set( 'units' ) }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
				<SelectControl
					label={ __( 'Search radius', 'softicon-store-locator' ) }
					help={ __( 'The first choice; visitors can change it. When no store is within it, the nearest three are shown.', 'softicon-store-locator' ) }
					value={ String( radius > 0 ? radius : 0 ) }
					// the list's choices, and the block's own if it is another
					options={ [ ...new Set( [ ...radii, radius > 0 ? radius : 0 ] ) ].sort( ( a, b ) => a - b ).map( ( r ) => ( { value: String( r ), label: r ? unit( r ) : __( 'Any distance', 'softicon-store-locator' ) } ) ) }
					onChange={ ( value ) => setAttributes( { radius: Number( value ) } ) }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
			</> }
		</> }
		<SelectControl
			label={ __( 'Directions link', 'softicon-store-locator' ) }
			help={ __( 'A link under each store on the map that opens the route there. Only a link: nothing is loaded from these services.', 'softicon-store-locator' ) }
			value={ directions }
			options={ [
				{ value: 'google', label: 'Google Maps' },
				{ value: 'apple', label: 'Apple Maps' },
				{ value: 'osm', label: 'OpenStreetMap' },
				{ value: '', label: __( 'None', 'softicon-store-locator' ) },
			] }
			onChange={ set( 'directions' ) }
			__nextHasNoMarginBottom
			__next40pxDefaultSize
		/>
	</Panel>;
};

export default SearchPanel;
