import { __ } from '@wordpress/i18n';
import { BlockIcon, useBlockProps } from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';
// copied from the shared softicon-tools folder by `npm run tools` (prebuild), edit it there
import useIframeAssets from '../../vendor/softicon-tools/hooks/useIframeAssets';
import Settings from './Settings/Settings';
import StoreCards from './StoreCards';
import { blockIcon } from '../../utils/icons';
import { maxStores } from '../../utils/options';
import { cleanStore } from '../../utils/store';

const Edit = ( { attributes, setAttributes } ) => {
	// a block installed from the inserter's search gets these only in the top window
	const assetsRef = useIframeAssets( [ 'softicon-store-locator-style-css', 'softicon-store-locator-editor-style-css' ] );
	const stores = ( Array.isArray( attributes.stores ) ? attributes.stores : [] )
		.slice( 0, maxStores )
		.map( cleanStore )
		.filter( Boolean );

	const blockProps = useBlockProps( {
		ref: assetsRef,
		className: stores.length ? 'alsl_locator' : undefined,
	} );

	return <>
		<Settings { ...{ attributes, setAttributes, stores } } />

		<div { ...blockProps }>
			{ stores.length
				? <StoreCards stores={ stores } />
				: <Placeholder
					icon={ <BlockIcon icon={ blockIcon } /> }
					label={ __( 'Store Locator', 'softicon-store-locator' ) }
					instructions={ __( 'No stores yet. The page leaves the block out until it has at least one store.', 'softicon-store-locator' ) }
				/> }
		</div>
	</>;
};

export default Edit;
