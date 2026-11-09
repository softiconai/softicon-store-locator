import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { ColorRow, Panel } from '../../../../vendor/softicon-tools/components/Panels';

const StylePanel = ( { attributes, setAttributes } ) => {
	const { markerImageUrl, markerImageId } = attributes;
	const color = ( key ) => ( { value: attributes[ key ], onChange: ( value ) => setAttributes( { [ key ]: value || '' } ) } );

	return <Panel id="colors" title={ __( 'Colors and marker', 'softicon-store-locator' ) }>
		<div className="siColors">
			<ColorRow label={ __( 'Marker', 'softicon-store-locator' ) } { ...color( 'markerColor' ) } />
			<ColorRow label={ __( 'Groups of markers', 'softicon-store-locator' ) } { ...color( 'clusterColor' ) } />
			<ColorRow label={ __( 'Button', 'softicon-store-locator' ) } { ...color( 'buttonBg' ) } />
			<ColorRow label={ __( 'Button text', 'softicon-store-locator' ) } { ...color( 'buttonColor' ) } />
		</div>
		<p className="alslHelp">{ __( 'The background, text and link colors and the text size are in WordPress’s own panels further down.', 'softicon-store-locator' ) }</p>

		<div className="alslImage">
			<p className="alslLabel">{ __( 'Marker picture', 'softicon-store-locator' ) }</p>
			{ markerImageUrl && <img className="alslMarkerPreview" src={ markerImageUrl } alt="" /> }
			<MediaUploadCheck>
				<MediaUpload
					allowedTypes={ [ 'image' ] }
					value={ markerImageId || undefined }
					onSelect={ ( media ) => setAttributes( { markerImageId: media.id, markerImageUrl: media.sizes?.medium?.url || media.url } ) }
					render={ ( { open } ) => <Button variant="secondary" onClick={ open } __next40pxDefaultSize>
						{ markerImageUrl ? __( 'Replace picture', 'softicon-store-locator' ) : __( 'Choose picture', 'softicon-store-locator' ) }
					</Button> }
				/>
			</MediaUploadCheck>
			{ markerImageUrl && <Button variant="tertiary" isDestructive onClick={ () => setAttributes( { markerImageId: 0, markerImageUrl: '' } ) }>
				{ __( 'Use the pin again', 'softicon-store-locator' ) }
			</Button> }
			<p className="alslHelp">{ __( 'Your logo or an icon instead of the pin, shown up to 40 × 40 px, standing on its bottom edge. A PNG or SVG with a see-through background looks best.', 'softicon-store-locator' ) }</p>
		</div>
	</Panel>;
};

export default StylePanel;
