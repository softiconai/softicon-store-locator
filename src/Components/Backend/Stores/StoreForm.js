import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import { Button, Notice, TextControl, TextareaControl } from '@wordpress/components';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { findPlace, queryOf } from '../../../map/geocode';
import { cleanStore, placeOf } from '../../../utils/store';
import { icons } from '../../../utils/icons';

const fields = [
	[ 'name', __( 'Name', 'softicon-store-locator' ) ],
	[ 'address', __( 'Address', 'softicon-store-locator' ) ],
	[ 'city', __( 'Town or city', 'softicon-store-locator' ) ],
	[ 'postcode', __( 'Postcode', 'softicon-store-locator' ) ],
	[ 'country', __( 'Country', 'softicon-store-locator' ) ],
	[ 'phone', __( 'Phone', 'softicon-store-locator' ), 'tel' ],
	[ 'email', __( 'Email', 'softicon-store-locator' ), 'email' ],
	[ 'website', __( 'Website', 'softicon-store-locator' ), 'url' ],
];

const StoreForm = ( { store, actions, geocoder, onClose } ) => {
	const [ finding, setFinding ] = useState( false );
	const [ found, setFound ] = useState( null );
	const abort = useRef();
	useEffect( () => () => abort.current?.abort(), [] );

	const set = ( key ) => ( value ) => actions.update( store.id, { [ key ]: value } );
	const shown = cleanStore( store, 0 );
	const place = placeOf( store );
	const query = queryOf( store );

	const find = async () => {
		abort.current?.abort();
		abort.current = new window.AbortController();
		setFinding( true );
		setFound( null );
		try {
			const hit = await findPlace( store, { url: geocoder, signal: abort.current.signal, near: true } );
			if ( hit ) {
				actions.update( store.id, { lat: hit.lat, lng: hit.lng } );
			}
			setFound( hit || { missing: true } );
		} catch ( error ) {
			if ( 'AbortError' !== error.name ) {
				setFound( { error: true } );
			}
		}
		setFinding( false );
	};

	return <div className="alslForm">
		<Button className="alslBack" icon={ icons.back } onClick={ onClose } variant="tertiary" size="compact">
			{ __( 'All stores', 'softicon-store-locator' ) }
		</Button>

		{ fields.map( ( [ key, label, type ] ) => <TextControl
			key={ key }
			label={ label }
			type={ type || 'text' }
			value={ store[ key ] ?? '' }
			onChange={ set( key ) }
			help={ ( 'email' === key && store.email && ! shown?.email ) || ( 'website' === key && store.website && ! shown?.website )
				? __( 'Not shown on the page: this is not a valid address.', 'softicon-store-locator' )
				: undefined }
			__nextHasNoMarginBottom
			__next40pxDefaultSize
		/> ) }

		<TextareaControl
			label={ __( 'Opening hours', 'softicon-store-locator' ) }
			help={ __( 'Shown as written, one line per row. For example: Mon–Fri 9:00–18:00', 'softicon-store-locator' ) }
			value={ store.hours ?? '' }
			onChange={ set( 'hours' ) }
			rows={ 3 }
			__nextHasNoMarginBottom
		/>

		<div className="alslPlace">
			<p className="alslLabel">{ __( 'Place on the map', 'softicon-store-locator' ) }</p>
			<Button variant="secondary" icon={ icons.search } onClick={ find } disabled={ ! query || finding } isBusy={ finding } __next40pxDefaultSize>
				{ finding ? __( 'Finding…', 'softicon-store-locator' ) : __( 'Find on map', 'softicon-store-locator' ) }
			</Button>
			{ ! query && <p className="alslHelp">{ __( 'Fill in the address first.', 'softicon-store-locator' ) }</p> }
			{ found?.label && found.near && <p className="alslHelp">{
				// translators: %s: the town the map service found
				sprintf( __( 'The street was not found, so the pin is in the town: %s. Drag it into place on the map.', 'softicon-store-locator' ), found.label )
			}</p> }
			{ found?.label && ! found.near && <p className="alslHelp">{
				// translators: %s: the place the map service found
				sprintf( __( 'Found: %s', 'softicon-store-locator' ), found.label )
			}</p> }
			{ found?.missing && <Notice status="warning" isDismissible={ false }>{ __( 'This address was not found. Check it, or click the map where the store is.', 'softicon-store-locator' ) }</Notice> }
			{ found?.error && <Notice status="error" isDismissible={ false }>{ __( 'The map service did not answer. Try again in a moment.', 'softicon-store-locator' ) }</Notice> }

			<div className="alslCoords">
				<TextControl label={ __( 'Latitude', 'softicon-store-locator' ) } value={ String( store.lat ?? '' ) } onChange={ set( 'lat' ) } inputMode="decimal" __nextHasNoMarginBottom __next40pxDefaultSize />
				<TextControl label={ __( 'Longitude', 'softicon-store-locator' ) } value={ String( store.lng ?? '' ) } onChange={ set( 'lng' ) } inputMode="decimal" __nextHasNoMarginBottom __next40pxDefaultSize />
			</div>
			<p className="alslHelp">{ place
				? __( 'Drag the orange pin on the map to move the store.', 'softicon-store-locator' )
				: __( 'Not on the map yet: find the address, or click the map where the store is.', 'softicon-store-locator' ) }</p>
		</div>

		<div className="alslImage">
			<p className="alslLabel">{ __( 'Image', 'softicon-store-locator' ) }</p>
			{ shown?.image && <img src={ shown.image } alt="" /> }
			<MediaUploadCheck>
				<MediaUpload
					allowedTypes={ [ 'image' ] }
					value={ store.imageId }
					onSelect={ ( media ) => actions.update( store.id, { imageId: media.id, imageUrl: media.sizes?.medium?.url || media.url } ) }
					render={ ( { open } ) => <Button variant="secondary" onClick={ open } __next40pxDefaultSize>
						{ store.imageUrl ? __( 'Replace image', 'softicon-store-locator' ) : __( 'Choose image', 'softicon-store-locator' ) }
					</Button> }
				/>
			</MediaUploadCheck>
			{ store.imageUrl && <Button variant="tertiary" isDestructive onClick={ () => actions.update( store.id, { imageId: 0, imageUrl: '' } ) }>
				{ __( 'Remove image', 'softicon-store-locator' ) }
			</Button> }
		</div>

		<Button className="alslDelete" variant="secondary" isDestructive icon={ icons.trash } onClick={ () => {
			actions.remove( store.id );
			onClose();
		} } __next40pxDefaultSize>
			{ __( 'Delete store', 'softicon-store-locator' ) }
		</Button>
	</div>;
};

export default StoreForm;
