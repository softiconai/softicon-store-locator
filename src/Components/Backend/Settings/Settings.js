import { InspectorControls } from '@wordpress/block-editor';
import { applyFilters } from '@wordpress/hooks';
import General from './General/General';
import { PanelGroup } from '../../../vendor/softicon-tools/components/Panels';

const Settings = ( { attributes, setAttributes, stores } ) => {
	return <InspectorControls>
		<div className="siSettings">
			<PanelGroup initial="stores">
				<General { ...{ attributes, setAttributes, stores } } />

				{ /* Add-ons append their own panels. */ }
				{ applyFilters( 'alsl.block.inspector', null, { tab: 'general', attributes, setAttributes, stores } ) }
			</PanelGroup>
		</div>
	</InspectorControls>;
};

export default Settings;
