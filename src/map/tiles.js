// the map tiles: OpenStreetMap, or any https tile server with {z}, {x} and {y} in its address

export const osmTiles = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export const isTileUrl = ( url ) => 'string' === typeof url &&
	/^https:\/\/[^\s"'<>]+$/.test( url ) &&
	[ '{z}', '{x}', '{y}' ].every( ( part ) => url.includes( part ) );

export const tilesOf = ( url ) => ( isTileUrl( url ) ? url : osmTiles );
