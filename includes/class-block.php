<?php
namespace ALSL_Store_Locator;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// the same rules are in src/utils/store.js and src/utils/options.js
class Block {

	const NAME = 'softicon/store-locator';
	const MAX  = 500;
	const TEXT = array( 'name', 'address', 'city', 'postcode', 'country' );
	const LOOK = array( 'layout', 'mapHeight', 'zoom', 'markerImageUrl', 'markerColor', 'clusterColor', 'buttonBg', 'buttonColor' );

	public function __construct() {
		add_action( 'init', array( $this, 'register' ) );
		add_filter( 'block_editor_settings_all', array( $this, 'editor_settings' ) );
		add_action( 'enqueue_block_assets', array( $this, 'editor_map' ) );
	}

	public function register() {
		register_block_type( ALSL_PLUGIN_PATH . 'build' );
	}

	// no Settings/Styles tabs; the site's map config for the editor
	public function editor_settings( $settings ) {
		$tabs                           = isset( $settings['blockInspectorTabs'] ) && is_array( $settings['blockInspectorTabs'] ) ? $settings['blockInspectorTabs'] : array();
		$tabs[ self::NAME ]             = false;
		$settings['blockInspectorTabs'] = $tabs;
		$settings['alsl']               = self::config( array() );
		return $settings;
	}

	// the editor's map: view.js in the editor iframe, where Leaflet's events work
	public function editor_map() {
		if ( is_admin() ) {
			wp_enqueue_script( 'softicon-store-locator-view-script' );
		}
	}

	public static function text( $data, $key ) {
		return isset( $data[ $key ] ) && is_scalar( $data[ $key ] ) ? trim( (string) $data[ $key ] ) : '';
	}

	// the raw value: (string) of a float follows the locale on PHP 7.4
	public static function coord( $value, $max ) {
		$value = is_numeric( $value ) && ! is_bool( $value ) ? (float) $value : INF;
		return abs( $value ) <= $max ? round( $value, 7 ) : null;
	}

	// %F ignores the locale
	public static function num( $value ) {
		return rtrim( rtrim( sprintf( '%.7F', $value ), '0' ), '.' );
	}

	public static function link( $value ) {
		return esc_url_raw( $value, array( 'http', 'https' ) );
	}

	// null when the store has nothing to show
	public static function store( $raw, $index ) {
		if ( ! is_array( $raw ) ) {
			return null;
		}
		$store = array();
		foreach ( self::TEXT as $key ) {
			$store[ $key ] = mb_substr( sanitize_text_field( self::text( $raw, $key ) ), 0, 200 );
		}
		$id    = sanitize_key( self::text( $raw, 'id' ) );
		$email = self::text( $raw, 'email' );
		$lat   = self::coord( isset( $raw['lat'] ) ? $raw['lat'] : null, 90 );
		$lng   = self::coord( isset( $raw['lng'] ) ? $raw['lng'] : null, 180 );
		$both  = null !== $lat && null !== $lng;

		$store += array(
			'id'      => '' !== $id ? substr( $id, 0, 40 ) : 's' . $index,
			'phone'   => mb_substr( trim( preg_replace( '/[^0-9+\-().\/\s]/', '', self::text( $raw, 'phone' ) ) ), 0, 40 ),
			'email'   => is_email( $email ) ? $email : '',
			'website' => self::link( self::text( $raw, 'website' ) ),
			'hours'   => mb_substr( sanitize_textarea_field( self::text( $raw, 'hours' ) ), 0, 500 ),
			'image'   => self::link( self::text( $raw, 'imageUrl' ) ),
			'lat'     => $both ? $lat : null,
			'lng'     => $both ? $lng : null,
		);
		return '' === $store['name'] . $store['address'] . $store['city'] ? null : $store;
	}

	public static function stores( $attributes ) {
		$list = isset( $attributes['stores'] ) && is_array( $attributes['stores'] ) ? array_slice( array_values( $attributes['stores'] ), 0, self::MAX ) : array();
		return array_values( array_filter( array_map( array( __CLASS__, 'store' ), $list, array_keys( $list ) ) ) );
	}

	public static function tel( $phone ) {
		$tel = preg_replace( '/[^0-9+]/', '', $phone );
		return strlen( $tel ) > 2 ? 'tel:' . $tel : '';
	}

	// read by view.js; '' tiles is OpenStreetMap, view.js checks the address
	public static function config( $attributes ) {
		$config = array(
			'click'  => ! empty( $attributes['loadOnClick'] ),
			'tiles'  => self::text( $attributes, 'tileUrl' ),
			'credit' => sanitize_text_field( self::text( $attributes, 'tileCredit' ) ),
			'search' => ! empty( $attributes['search'] ),
			'geo'    => ! empty( $attributes['geocodeSearch'] ),
			'near'   => ! empty( $attributes['nearMe'] ),
			'units'  => 'mi' === self::text( $attributes, 'units' ) ? 'mi' : 'km',
			'radius' => isset( $attributes['radius'] ) ? absint( $attributes['radius'] ) : 0,
			'route'  => self::text( $attributes, 'directions' ),
			// only the map and the search use these, so view.js checks and sets them
			'look'   => array_intersect_key( $attributes, array_flip( self::LOOK ) ),
		);
		return apply_filters( 'alsl_config', $config, $attributes );
	}
}
