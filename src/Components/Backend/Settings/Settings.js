import { InspectorControls } from '@wordpress/block-editor';
import { applyFilters } from '@wordpress/hooks';
import General, { Help } from './General/General';
import MapPanel from './Map/Map';
import SearchPanel from './Search/Search';
import LayoutPanel from './Layout/Layout';
import StylePanel from './Style/Style';
import { PanelGroup } from '../../../vendor/softicon-tools/components/Panels';

const Settings = ( props ) => {
	const { attributes, setAttributes } = props;
	return <InspectorControls>
		<div className="siSettings">
			<PanelGroup initial="stores">
				<General { ...props } />
				<SearchPanel { ...{ attributes, setAttributes } } />
				<LayoutPanel { ...{ attributes, setAttributes } } />
				<StylePanel { ...{ attributes, setAttributes } } />
				<MapPanel { ...{ attributes, setAttributes } } />

				{ /* Add-ons append their own panels. */ }
				{ applyFilters( 'alsl.block.inspector', null, { tab: 'general', attributes, setAttributes, stores: props.stores } ) }
				<Help />
			</PanelGroup>
		</div>
	</InspectorControls>;
};

export default Settings;
