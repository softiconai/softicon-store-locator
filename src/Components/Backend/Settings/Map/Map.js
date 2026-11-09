import { __ } from '@wordpress/i18n';
import { Notice, RangeControl, TextControl } from '@wordpress/components';
import { Panel, ToggleRow } from '../../../../vendor/softicon-tools/components/Panels';
import { isTileUrl, osmTiles } from '../../../../map/tiles';

const MapPanel = ( { attributes, setAttributes } ) => {
	const { loadOnClick, tileUrl, tileCredit, zoom } = attributes;
	const custom = '' !== tileUrl.trim();

	return <Panel id="map" title={ __( 'Map', 'softicon-store-locator' ) }>
		<ToggleRow
			label={ __( 'Load the map on click', 'softicon-store-locator' ) }
			tip={ __( 'Visitors first see a Show map button, and nothing is loaded from the map server before they click it. Helps with privacy laws such as the GDPR. The editor always shows the map.', 'softicon-store-locator' ) }
			checked={ loadOnClick }
			onChange={ ( value ) => setAttributes( { loadOnClick: value } ) }
		/>

		<ToggleRow
			label={ __( 'Show all stores at first', 'softicon-store-locator' ) }
			tip={ __( 'The map opens zoomed to fit every store. Off: it opens at the zoom you choose, centred on the stores.', 'softicon-store-locator' ) }
			checked={ ! zoom }
			onChange={ ( on ) => setAttributes( { zoom: on ? 0 : 12 } ) }
		/>
		{ !! zoom && <RangeControl
			label={ __( 'Starting zoom', 'softicon-store-locator' ) }
			help={ __( '2 shows the world, 10 a region, 14 a town, 18 a street.', 'softicon-store-locator' ) }
			value={ zoom }
			min={ 2 }
			max={ 18 }
			onChange={ ( value ) => setAttributes( { zoom: value || 12 } ) }
			__nextHasNoMarginBottom
			__next40pxDefaultSize
		/> }

		<TextControl
			label={ __( 'Tile server', 'softicon-store-locator' ) }
			help={ __( 'Leave empty for OpenStreetMap. Or the https address of another tile server, with {z}, {x} and {y} in it.', 'softicon-store-locator' ) }
			placeholder={ osmTiles }
			value={ tileUrl }
			onChange={ ( value ) => setAttributes( { tileUrl: value } ) }
			__nextHasNoMarginBottom
			__next40pxDefaultSize
		/>
		{ custom && ! isTileUrl( tileUrl.trim() ) && <Notice status="warning" isDismissible={ false }>
			{ __( 'This is not a tile address, so the map uses OpenStreetMap. It must start with https:// and contain {z}, {x} and {y}.', 'softicon-store-locator' ) }
		</Notice> }

		{ custom && <TextControl
			label={ __( 'Map credit', 'softicon-store-locator' ) }
			help={ __( 'The credit the tile server asks for, shown in the corner of the map after the OpenStreetMap credit.', 'softicon-store-locator' ) }
			value={ tileCredit }
			onChange={ ( value ) => setAttributes( { tileCredit: value } ) }
			__nextHasNoMarginBottom
			__next40pxDefaultSize
		/> }
	</Panel>;
};

export default MapPanel;
