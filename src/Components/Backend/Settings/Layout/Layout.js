import { __ } from '@wordpress/i18n';
import { RangeControl } from '@wordpress/components';
import { Panel, Tiles } from '../../../../vendor/softicon-tools/components/Panels';
import { layoutIcons } from '../../../../utils/icons';
import { heightOf } from '../../../../utils/look';

const LayoutPanel = ( { attributes, setAttributes } ) => {
	const { layout, mapHeight } = attributes;

	return <Panel id="layout" title={ __( 'Layout and size', 'softicon-store-locator' ) }>
		<Tiles
			label={ __( 'Layout', 'softicon-store-locator' ) }
			tip={ __( 'On a phone or in a narrow column the map is always above the list. With Map only, the list stays in the page for search engines, and each store shows when its pin is clicked.', 'softicon-store-locator' ) }
			value={ layout }
			options={ [
				{ value: 'left', label: __( 'List left', 'softicon-store-locator' ), icon: layoutIcons.left },
				{ value: 'right', label: __( 'List right', 'softicon-store-locator' ), icon: layoutIcons.right },
				{ value: 'below', label: __( 'List below', 'softicon-store-locator' ), icon: layoutIcons.below },
				{ value: 'map', label: __( 'Map only', 'softicon-store-locator' ), icon: layoutIcons.map },
			] }
			onChange={ ( value ) => setAttributes( { layout: value } ) }
		/>
		<RangeControl
			label={ __( 'Map height (px)', 'softicon-store-locator' ) }
			help={ __( 'With the list beside the map, the list scrolls within this height. On phones the map is at most 70% of the screen.', 'softicon-store-locator' ) }
			value={ heightOf( mapHeight ) }
			min={ 240 }
			max={ 900 }
			step={ 20 }
			onChange={ ( value ) => setAttributes( { mapHeight: value || 480 } ) }
			__nextHasNoMarginBottom
			__next40pxDefaultSize
		/>
		<p className="alslHelp">{ __( 'Use Wide or Full width in the block toolbar for a larger map.', 'softicon-store-locator' ) }</p>
	</Panel>;
};

export default LayoutPanel;
