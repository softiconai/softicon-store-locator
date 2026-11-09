<?php
namespace ALSL_Store_Locator;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Block {

	const NAME = 'softicon/store-locator';

	// stores per block in Free: post content size and editor speed; the same number is in src/utils/options.js
	const MAX_STORES = 500;

	// one-line text fields of a store; the same list is in src/utils/store.js
	const TEXT = array( 'name', 'address', 'city', 'postcode', 'country' );

	public function __construct() {
		add_action( 'init', array( $this, 'register' ) );
		add_filter( 'block_editor_settings_all', array( $this, 'no_inspector_tabs' ) );
	}

	public function register() {
		register_block_type( ALSL_PLUGIN_PATH . 'build' );
	}

	// the block has its own panels, not WordPress's Settings/Styles tabs
	public function no_inspector_tabs( $settings ) {
		$tabs                           = isset( $settings['blockInspectorTabs'] ) && is_array( $settings['blockInspectorTabs'] ) ? $settings['blockInspectorTabs'] : array();
		$tabs[ self::NAME ]             = false;
		$settings['blockInspectorTabs'] = $tabs;
		return $settings;
	}

	// a media id becomes its image only when it is unattached, on a public post, or editable by this post's author:
	// otherwise a contributor could try ids to find images of private drafts
	public static function may_use( $id ) {
		$parent = (int) wp_get_post_parent_id( $id );
		if ( ! $parent || is_post_publicly_viewable( $parent ) ) {
			return true;
		}
		$post   = (int) get_the_ID();
		$author = $post ? (int) get_post_field( 'post_author', $post ) : 0;
		return $author && user_can( $author, 'edit_post', $id );
	}

	// a number in -$max..$max, or null
	public static function coord( $value, $max ) {
		if ( ! is_numeric( $value ) ) {
			return null;
		}
		$value = (float) $value;
		return is_finite( $value ) && abs( $value ) <= $max ? round( $value, 7 ) : null;
	}

	// a http(s) address, or ''
	public static function link( $value ) {
		return is_string( $value ) ? esc_url_raw( trim( $value ), array( 'http', 'https' ) ) : '';
	}

	// one store, checked and cleaned; null when it has nothing to show
	public static function store( $raw, $index ) {
		if ( ! is_array( $raw ) ) {
			return null;
		}
		$text  = function ( $key ) use ( $raw ) {
			return isset( $raw[ $key ] ) && is_scalar( $raw[ $key ] ) ? (string) $raw[ $key ] : '';
		};
		$store = array();
		foreach ( self::TEXT as $key ) {
			$store[ $key ] = mb_substr( sanitize_text_field( $text( $key ) ), 0, 200 );
		}
		$id    = sanitize_key( $text( 'id' ) );
		$email = sanitize_email( $text( 'email' ) );
		$image = isset( $raw['imageId'] ) ? absint( $raw['imageId'] ) : 0;
		$url   = $image && wp_attachment_is_image( $image ) && self::may_use( $image ) ? wp_get_attachment_image_url( $image, 'medium' ) : '';

		$store += array(
			'id'      => '' !== $id ? substr( $id, 0, 40 ) : 's' . $index,
			// digits, spaces and + - ( ) . /
			'phone'   => mb_substr( trim( preg_replace( '/[^0-9+\-().\/\s]/', '', $text( 'phone' ) ) ), 0, 40 ),
			'email'   => is_email( $email ) ? $email : '',
			'website' => self::link( $text( 'website' ) ),
			'hours'   => mb_substr( sanitize_textarea_field( $text( 'hours' ) ), 0, 500 ),
			'image'   => $url ? $url : self::link( $text( 'imageUrl' ) ),
			'lat'     => self::coord( isset( $raw['lat'] ) ? $raw['lat'] : null, 90 ),
			'lng'     => self::coord( isset( $raw['lng'] ) ? $raw['lng'] : null, 180 ),
		);
		return '' === $store['name'] && '' === $store['address'] && '' === $store['city'] ? null : $store;
	}

	// the block's stores, checked, at most MAX_STORES
	public static function stores( $attributes ) {
		$list   = isset( $attributes['stores'] ) && is_array( $attributes['stores'] ) ? array_slice( array_values( $attributes['stores'] ), 0, self::MAX_STORES ) : array();
		$stores = array();
		foreach ( $list as $index => $raw ) {
			$store = self::store( $raw, $index );
			if ( $store ) {
				$stores[] = $store;
			}
		}
		return $stores;
	}

	// a phone number as a tel: link, only + and digits
	public static function tel( $phone ) {
		$tel = preg_replace( '/[^0-9+]/', '', $phone );
		return strlen( $tel ) > 2 ? 'tel:' . $tel : '';
	}

	// settings read by view.js; the stores themselves are in the list's HTML
	public static function config( $attributes ) {
		$config = array(
			'tiles'    => 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
			'geocoder' => 'https://nominatim.openstreetmap.org/search',
		);
		return apply_filters( 'alsl_config', $config, $attributes );
	}
}
