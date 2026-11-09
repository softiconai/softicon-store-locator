<?php
/**
 * Plugin Name: SoftIcon Store Locator
 * Description: A store locator block with an OpenStreetMap map. Visitors find the nearest store by town, postcode or their location. No Google Maps API key.
 * Version: 1.0.0
 * Requires at least: 6.5
 * Requires PHP: 7.4
 * Author: softiconai
 * Author URI: https://profiles.wordpress.org/softiconai/
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: softicon-store-locator
 * Domain Path: /languages
 *
 * @package SoftIcon_Store_Locator
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'ALSL_PLUGIN_VERSION', '1.0.0' );
define( 'ALSL_PLUGIN_PATH', plugin_dir_path( __FILE__ ) );

require_once ALSL_PLUGIN_PATH . 'includes/class-block.php';
new ALSL_Store_Locator\Block();

// add-ons hook in here
do_action( 'alsl_loaded' );
