import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import { BlockIcon, useBlockProps } from '@wordpress/block-editor';
import { Button, ExternalLink, Placeholder } from '@wordpress/components';
import { useMergeRefs } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
// copied from the shared softicon-tools folder by `npm run tools` (prebuild), edit it there
import useIframeAssets from '../../vendor/softicon-tools/hooks/useIframeAssets';
import Settings from './Settings/Settings';
import StoreCards from './StoreCards';
import SearchPreview from './SearchPreview';
import CsvImport from './Stores/CsvImport';
import useStores, { fixIds } from './Stores/useStores';
import { blockIcon, icons } from '../../utils/icons';
import { maxStores, videos } from '../../utils/options';
import { cleanStore, text } from '../../utils/store';
import { lookOf } from '../../utils/look';

const EMPTY = [];
const round = ( value ) => Math.round( value * 1e6 ) / 1e6;

// The live map: view.js runs inside the editor's iframe (Block::editor_map()) and opens the same map as the page.
// The block tells it when to start, update (after every change) and stop; React leaves .alsl_map to Leaflet.
// The map answers with alsl:moved (the store being edited was dragged or placed) and alsl:pick (a store was clicked).
const useMap = ( ref, key, on ) => {
	const handlers = useRef( on );
	handlers.current = on;

	useEffect( () => {
		const el = ref.current;
		const moved = ( event ) => handlers.current.moved( event.detail || {} );
		const pick = ( event ) => handlers.current.pick( event.detail || {} );
		el?.addEventListener( 'alsl:moved', moved );
		el?.addEventListener( 'alsl:pick', pick );
		return () => {
			el?.removeEventListener( 'alsl:moved', moved );
			el?.removeEventListener( 'alsl:pick', pick );
			el?.dispatchEvent( new window.Event( 'alsl:destroy' ) );
		};
	}, [ ref ] );

	// boot first: the block may have only now become a locator (its first store)
	useEffect( () => {
		const el = ref.current;
		el?.ownerDocument.dispatchEvent( new window.Event( 'alsl:boot' ) );
		el?.dispatchEvent( new window.Event( 'alsl:update' ) );
	}, [ ref, key ] );
};

const Edit = ( { attributes, setAttributes, clientId } ) => {
	const { loadOnClick, tileUrl, tileCredit } = attributes;
	const [ editing, setEditing ] = useState( '' );
	const [ importing, setImporting ] = useState( false );
	const actions = useStores( clientId );
	// a block installed from the inserter's search gets these only in the top window
	const assetsRef = useIframeAssets( [ 'softicon-store-locator-style-css', 'softicon-store-locator-editor-style-css' ] );
	const ref = useRef();
	// the site's map config (the alsl_config filter); the inserter's previews show the list only
	const { site, isPreview } = useSelect( ( select ) => {
		const settings = select( 'core/block-editor' ).getSettings();
		return { site: settings.alsl || {}, isPreview: settings.isPreviewMode };
	}, [] );

	// stores need an id each for the list, the form and the map; only hand-made or broken content lacks one
	const raw = Array.isArray( attributes.stores ) ? attributes.stores : EMPTY;
	useEffect( () => {
		if ( ! isPreview && fixIds( raw ) !== raw ) {
			setAttributes( { stores: fixIds( raw ) } );
		}
	}, [ raw, isPreview, setAttributes ] );

	const stores = raw.slice( 0, maxStores ).map( cleanStore ).filter( Boolean );
	const edited = editing && raw.some( ( store ) => store?.id === editing ) ? editing : '';
	const hasMap = ! isPreview && ( !! edited || stores.some( ( store ) => null !== store.lat ) );
	// as render.php prints it; "load on click" is for visitors, the editor shows the map straight away
	// the same keys as Block::LOOK in PHP
	const look = Object.fromEntries( [ 'layout', 'mapHeight', 'zoom', 'markerImageUrl', 'markerColor', 'clusterColor', 'buttonBg', 'buttonColor' ].map( ( key ) => [ key, attributes[ key ] ] ) );
	const config = JSON.stringify( { ...site, click: loadOnClick, tiles: text( tileUrl ) || site.tiles || '', credit: text( tileCredit ) || site.credit || '', editor: true, editing: edited, look } );
	const { className: lookClass, style: lookStyle } = lookOf( look );
	useMap( ref, JSON.stringify( [ config, stores ] ), {
		moved: ( { id, lat, lng } ) => Number.isFinite( lat ) && Number.isFinite( lng ) && actions.update( id, { lat: round( lat ), lng: round( lng ) } ),
		pick: ( { id } ) => id && setEditing( id ),
	} );

	const blockProps = useBlockProps( {
		ref: useMergeRefs( [ assetsRef, ref ] ),
		className: stores.length || edited ? 'alsl_locator ' + lookClass + ( hasMap ? ' alsl_ready' : '' ) : undefined,
		style: stores.length || edited ? lookStyle : undefined,
		'data-alsl': stores.length || edited ? config : undefined,
	} );

	return <>
		<Settings { ...{ attributes, setAttributes, stores, actions, editing: edited, setEditing, setImporting, geocoder: site.geocoder } } />
		{ importing && <CsvImport actions={ actions } onClose={ () => setImporting( false ) } /> }

		<div { ...blockProps }>
			{ stores.length || edited
				? <>
					{ attributes.search && <SearchPreview attributes={ attributes } /> }
					<div className="alsl_inner">
						{ /* Leaflet fills this, React leaves its content alone */ }
						{ hasMap && <div className="alsl_map" /> }
						<StoreCards stores={ stores } route={ attributes.directions } />
					</div>
				</>
				: <Placeholder
					icon={ <BlockIcon icon={ blockIcon } /> }
					label={ __( 'Store Locator', 'softicon-store-locator' ) }
					instructions={ __( 'Add your stores one by one, or import them from a CSV file. The map uses OpenStreetMap, no API key needed.', 'softicon-store-locator' ) }
				>
					{ ! isPreview && <>
						<Button variant="primary" icon={ icons.add } onClick={ () => setEditing( actions.add() ) }>{ __( 'Add store', 'softicon-store-locator' ) }</Button>
						<Button variant="secondary" icon={ icons.upload } onClick={ () => setImporting( true ) }>{ __( 'Import CSV', 'softicon-store-locator' ) }</Button>
						<ExternalLink className="alslVideo" href={ videos.tutorial }>{ __( 'Watch the 2-minute setup video', 'softicon-store-locator' ) }</ExternalLink>
					</> }
				</Placeholder> }
		</div>
	</>;
};

export default Edit;
