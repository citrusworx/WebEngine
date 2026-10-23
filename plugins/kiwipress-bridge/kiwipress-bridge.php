<?php
/**
 * Plugin Name: KiwiPress Bridge
 * Plugin URI: https://github.com/citrusworx/WebEngine
 * Description: WordPress-side bridge for KiwiPress. Public health, pairing settings, draft preview, and optional front-end lockdown. Content stays on /wp/v2.
 * Version: 0.2.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author: CitrusWorx
 * License: MIT
 * Text Domain: kiwipress-bridge
 *
 * KiwiPress already knows this site's URL. It calls the public health route,
 * stores one WordPress application password on the KiwiPress side, then writes
 * the frontend URL (and pairing flags) here over authenticated REST.
 *
 * This plugin does not sync content, open tunnels, or phone home.
 * The TypeScript client in packages/kiwipress owns HTTP and content.
 *
 * Lockdown behavior is seeded from Drew Winkles' "Activate Headless Mode"
 * plugin and corrected: see includes/lockdown.php and includes/rest.php.
 *
 * @package KiwiPressBridge
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'KIWIPRESS_BRIDGE_VERSION', '0.2.0' );
define( 'KIWIPRESS_BRIDGE_FILE', __FILE__ );
define( 'KIWIPRESS_BRIDGE_DIR', plugin_dir_path( __FILE__ ) );
define( 'KIWIPRESS_BRIDGE_OPTION', 'kiwipress_bridge' );
define( 'KIWIPRESS_BRIDGE_PREVIEW_SECRET_OPTION', 'kiwipress_bridge_preview_secret' );

require_once KIWIPRESS_BRIDGE_DIR . 'includes/options.php';
require_once KIWIPRESS_BRIDGE_DIR . 'includes/lockdown.php';
require_once KIWIPRESS_BRIDGE_DIR . 'includes/rest.php';
require_once KIWIPRESS_BRIDGE_DIR . 'includes/preview.php';
require_once KIWIPRESS_BRIDGE_DIR . 'includes/admin.php';

register_activation_hook( KIWIPRESS_BRIDGE_FILE, 'kiwipress_bridge_activate' );

kiwipress_bridge_lockdown_register();
kiwipress_bridge_rest_register();
kiwipress_bridge_preview_register();
kiwipress_bridge_admin_register();

/**
 * Seed the single option the first time the plugin is activated.
 *
 * Re-activation fills keys that are missing and does not overwrite a URL,
 * lockdown flag, or pairing state the site already saved.
 */
function kiwipress_bridge_activate() {
	$defaults = kiwipress_bridge_defaults();
	$existing = get_option( KIWIPRESS_BRIDGE_OPTION, null );

	if ( ! is_array( $existing ) ) {
		// update_option creates the row when it is missing, and replaces a
		// non-array value if one was stored by hand.
		update_option( KIWIPRESS_BRIDGE_OPTION, $defaults );
	} else {
		update_option( KIWIPRESS_BRIDGE_OPTION, array_merge( $defaults, $existing ) );
	}

	// Separate row, autoload no. Upgrades that skip this hook create it on
	// the first preview mint or verify instead.
	kiwipress_bridge_ensure_preview_secret();
}
