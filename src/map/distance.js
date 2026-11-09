// straight-line distance on the earth (haversine), in km or miles
const RADIUS = { km: 6371.0088, mi: 3958.7613 };

export const distance = ( a, b, units = 'km' ) => {
	const rad = Math.PI / 180;
	const dLat = ( b.lat - a.lat ) * rad;
	const dLng = ( b.lng - a.lng ) * rad;
	const h = ( Math.sin( dLat / 2 ) ** 2 ) + ( Math.cos( a.lat * rad ) * Math.cos( b.lat * rad ) * ( Math.sin( dLng / 2 ) ** 2 ) );
	return 2 * ( RADIUS[ units ] || RADIUS.km ) * Math.asin( Math.min( 1, Math.sqrt( h ) ) );
};

// the visitor's choices for the search radius, in the block's units; 0 is any distance
export const radii = [ 0, 5, 10, 25, 50, 100 ];

// where the directions link goes: only a link, the route planner opens on its own site
export const routes = {
	google: ( p ) => 'https://www.google.com/maps/dir/?api=1&destination=' + p.lat + ',' + p.lng,
	apple: ( p ) => 'https://maps.apple.com/?daddr=' + p.lat + ',' + p.lng,
	osm: ( p ) => 'https://www.openstreetmap.org/directions?to=' + p.lat + ',' + p.lng,
};
