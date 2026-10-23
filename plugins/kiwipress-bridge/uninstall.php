<?php
/**
 * Remove the bridge option when the plugin is deleted from wp-admin.
 *
 * Deactivation leaves the option in place so a later activate keeps the URL
 * and pairing flags. Delete is the explicit wipe.
 *
 * The option name is duplicated here on purpose: uninstall.php must not load
 * the plugin bootstrap (that would register hooks during deletion).
 *
 * @package KiwiPressBridge
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'kiwipress_bridge' );
delete_option( 'kiwipress_bridge_preview_secret' );
