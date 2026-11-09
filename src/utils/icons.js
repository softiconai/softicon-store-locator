import { SVG, Path } from '@wordpress/primitives';

// a map pin over a folded map
export const blockIcon = <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
	<Path d="M12 2a5 5 0 0 0-5 5c0 3.6 5 9 5 9s5-5.4 5-9a5 5 0 0 0-5-5m0 1.5A3.5 3.5 0 0 1 15.5 7c0 2-2.1 5-3.5 6.7C10.6 12 8.5 9 8.5 7A3.5 3.5 0 0 1 12 3.5M12 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4M5.6 13 2 14.6V22l5.5-2.2 9 2.2 5.5-2.2v-7.4L18.4 13l-.7 1.4 2.8-1.2V19l-4 1.6-9-2.2-4 1.6v-4.9l2.6-1.1z" />
</SVG>;

// small icons for the store list
export const path = ( d ) => <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><Path d={ d } /></SVG>;

export const icons = {
	add: path( 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z' ),
	up: path( 'M12 7.5 5.5 14l1.4 1.4 5.1-5.1 5.1 5.1 1.4-1.4z' ),
	down: path( 'M12 16.5 5.5 10l1.4-1.4 5.1 5.1 5.1-5.1 1.4 1.4z' ),
	trash: path( 'M9 3h6l1 2h4v2H4V5h4zm-3 6h12l-1 12H7zm3 2 .5 8h1.5l-.5-8zm4.5 0-.5 8h1.5l.5-8z' ),
	back: path( 'M10.6 6 4.6 12l6 6 1.4-1.4L8.4 13H20v-2H8.4L12 7.4z' ),
	upload: path( 'M12 3.5 7 8.5l1.4 1.4L11 7.3V16h2V7.3l2.6 2.6L17 8.5zM5 18h14v2H5z' ),
	download: path( 'M12 16.5 7 11.5l1.4-1.4 2.6 2.6V4h2v8.7l2.6-2.6 1.4 1.4zM5 18h14v2H5z' ),
	search: path( 'M10.5 4a6.5 6.5 0 0 1 5.2 10.4l4.4 4.4-1.4 1.4-4.4-4.4A6.5 6.5 0 1 1 10.5 4m0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9' ),
	noPin: path( 'M12 2a6 6 0 0 1 6 6c0 1.6-.7 3.4-1.6 5.1l-1.5-1.5c.7-1.3 1.1-2.6 1.1-3.6a4 4 0 0 0-6.9-2.8L7.7 3.8A6 6 0 0 1 12 2M3.4 3.4l17.2 17.2-1.4 1.4-4-4C13.6 19.8 12 21.4 12 21.4S6 15.6 6 8.6L2 4.8z' ),
};

// the layouts: list and map side by side, the list under the map, or the map alone
export const layoutIcons = {
	left: path( 'M3 5h18v14H3zm1.5 1.5v11h5v-11zm6.5 0v11h8.5v-11zM5.5 8h3v1h-3zm0 2.5h3v1h-3zm0 2.5h3v1h-3z' ),
	right: path( 'M3 5h18v14H3zm1.5 1.5v11H13v-11zm10 0v11h5v-11zM15.5 8h3v1h-3zm0 2.5h3v1h-3zm0 2.5h3v1h-3z' ),
	below: path( 'M3 4h18v16H3zm1.5 1.5v7h15v-7zm0 8.5v4.5h7V14zm8.5 0v4.5h6.5V14z' ),
	map: path( 'M3 5h18v14H3zm1.5 1.5v11h15v-11zM12 8a2.5 2.5 0 0 1 2.5 2.5c0 1.9-2.5 4.5-2.5 4.5s-2.5-2.6-2.5-4.5A2.5 2.5 0 0 1 12 8' ),
};
