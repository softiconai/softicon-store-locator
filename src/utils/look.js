// the block's look for the map and the search, from config.look (render.php) or the attributes (editor):
// checked here, so PHP only passes it on. Used by view.js, the map and Edit.js.

export const layouts = [ 'left', 'right', 'below', 'map' ];

// hex, rgb(a), hsl(a) or a preset var(), nothing else
const COLOR = /^(#[0-9a-f]{3,8}|(rgb|hsl)a?\([0-9.,%\s/]+\)|var\(--[a-z0-9-]+\))$/i;
const colorOf = ( value ) => ( 'string' === typeof value && COLOR.test( value.trim() ) ? value.trim() : '' );

// the Map height slider's range
export const heightOf = ( value ) => Math.min( 900, Math.max( 240, Math.round( Number( value ) ) || 480 ) );

// classes and CSS variables for the block's wrapper
export const lookOf = ( look = {} ) => {
	const layout = layouts.includes( look.layout ) ? look.layout : 'left';
	const style = { '--alsl-height': heightOf( look.mapHeight ) + 'px' };
	const classes = [ 'alsl_layout_' + layout ];
	[ [ 'markerColor', '--alsl-marker' ], [ 'clusterColor', '--alsl-cluster' ], [ 'buttonBg', '--alsl-button-bg', 'alsl_button_bg' ], [ 'buttonColor', '--alsl-button-color', 'alsl_button_color' ] ]
		.forEach( ( [ key, variable, flag ] ) => {
			const color = colorOf( look[ key ] );
			if ( color ) {
				style[ variable ] = color;
				if ( flag ) {
					classes.push( flag );
				}
			}
		} );
	return { className: classes.join( ' ' ), style };
};

// the marker picture's address, http(s) only
export const markerOf = ( look = {} ) => {
	try {
		const url = new URL( look.markerImageUrl );
		return [ 'http:', 'https:' ].includes( url.protocol ) ? url.href : '';
	} catch ( e ) {
		return '';
	}
};

// 0: the map shows all the stores; 2–18: this zoom, centred on them
export const zoomOf = ( look = {} ) => {
	const zoom = Math.round( Number( look.zoom ) );
	return zoom >= 2 && zoom <= 18 ? zoom : 0;
};
