<?php
/**
 * Top-level KiwiPress screen in wp-admin.
 *
 * Read-mostly status: connection (paired or not), the frontend URL, the
 * lockdown checkbox, and the same facts the public health route returns.
 * Saving goes through the WordPress Settings API. paired and
 * project_label are shown, not edited — KiwiPress writes those over REST.
 *
 * No React, no build step, no admin JavaScript. Markup uses core admin
 * classes (wrap, card, notice, form-table, widefat).
 *
 * @package KiwiPressBridge
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Menu and Settings API registration. Both hooks no-op outside wp-admin.
 */
function kiwipress_bridge_admin_register() {
	add_action( 'admin_menu', 'kiwipress_bridge_register_menu' );
	add_action( 'admin_init', 'kiwipress_bridge_register_settings' );
}

/**
 * Top-level "KiwiPress" item. Capability matches the REST settings routes.
 */
function kiwipress_bridge_register_menu() {
	add_menu_page(
		__( 'KiwiPress', 'kiwipress-bridge' ),
		__( 'KiwiPress', 'kiwipress-bridge' ),
		'manage_options',
		'kiwipress-bridge',
		'kiwipress_bridge_render_page',
		'dashicons-admin-site-alt3'
	);
}

/**
 * One option, whitelist for options.php. The screen renders its own cards
 * instead of do_settings_sections(), so there is no settings table chrome.
 */
function kiwipress_bridge_register_settings() {
	register_setting(
		'kiwipress_bridge',
		KIWIPRESS_BRIDGE_OPTION,
		array(
			'type'              => 'array',
			'sanitize_callback' => 'kiwipress_bridge_sanitize_options',
			'default'           => kiwipress_bridge_defaults(),
			'show_in_rest'      => false,
		)
	);
}

/**
 * Render the status screen.
 */
function kiwipress_bridge_render_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Sorry, you are not allowed to access this page.', 'kiwipress-bridge' ) );
	}

	$options = kiwipress_bridge_get_options();
	$health  = kiwipress_bridge_health_payload();
	$paired  = $options['paired'];

	if ( isset( $_GET['preview-revoked'] ) && '1' === $_GET['preview-revoked'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		add_settings_error(
			'kiwipress_bridge',
			'kiwipress_bridge_preview_revoked',
			__( 'Preview links were revoked. Existing draft links no longer open.', 'kiwipress-bridge' ),
			'success'
		);
	}

	echo '<div class="wrap">';
	echo '<h1>' . esc_html__( 'KiwiPress', 'kiwipress-bridge' ) . '</h1>';
	echo '<p class="description">';
	echo esc_html__(
		'WordPress-side bridge. KiwiPress calls the health route, then writes the frontend URL here. Posts and pages still move over /wp/v2. This screen does not sync content.',
		'kiwipress-bridge'
	);
	echo '</p>';

	// No slug: options.php stores both our field errors and the "Settings saved." notice.
	settings_errors();

	echo '<form method="post" action="options.php">';
	settings_fields( 'kiwipress_bridge' );

	echo '<div class="card">';
	echo '<h2>' . esc_html__( 'Connection', 'kiwipress-bridge' ) . '</h2>';

	if ( $paired ) {
		echo '<div class="notice notice-success inline"><p><strong>' . esc_html__( 'Connected', 'kiwipress-bridge' ) . '</strong></p></div>';
	} else {
		echo '<div class="notice notice-warning inline"><p><strong>' . esc_html__( 'Disconnected', 'kiwipress-bridge' ) . '</strong></p></div>';
	}

	echo '<p class="description">';
	echo esc_html__(
		'Connected after KiwiPress stores an application password for this site and marks it paired. This plugin does not call KiwiPress.',
		'kiwipress-bridge'
	);
	echo '</p>';

	if ( $options['project_label'] !== '' ) {
		echo '<p><strong>' . esc_html__( 'Project', 'kiwipress-bridge' ) . '</strong><br>';
		echo esc_html( $options['project_label'] );
		echo '</p>';
	}

	echo '<table class="form-table" role="presentation"><tbody>';

	echo '<tr>';
	echo '<th scope="row"><label for="kiwipress-bridge-frontend-url">' . esc_html__( 'Frontend URL', 'kiwipress-bridge' ) . '</label></th>';
	echo '<td>';
	echo '<input name="' . esc_attr( KIWIPRESS_BRIDGE_OPTION ) . '[frontend_url]" id="kiwipress-bridge-frontend-url" type="url" class="regular-text code" placeholder="https://" value="' . esc_attr( $options['frontend_url'] ) . '" />';
	echo '<p class="description">' . esc_html__( 'Anonymous visitors are redirected here while lockdown is on. Leave blank to show the headless page until KiwiPress writes a URL.', 'kiwipress-bridge' ) . '</p>';
	echo '</td>';
	echo '</tr>';

	echo '<tr>';
	echo '<th scope="row">' . esc_html__( 'Lockdown', 'kiwipress-bridge' ) . '</th>';
	echo '<td>';
	echo '<label for="kiwipress-bridge-lockdown">';
	echo '<input name="' . esc_attr( KIWIPRESS_BRIDGE_OPTION ) . '[lockdown]" id="kiwipress-bridge-lockdown" type="checkbox" value="1" ' . checked( $options['lockdown'], true, false ) . ' /> ';
	echo esc_html__( 'Lock the public theme', 'kiwipress-bridge' );
	echo '</label>';
	echo '<p class="description">' . esc_html__( 'Logged-out visitors are redirected to the frontend URL, or see “Headless Mode Activated” when it is empty. wp-admin, login, REST, cron, and AJAX stay open. A logged-in draft preview is sent to the frontend instead.', 'kiwipress-bridge' ) . '</p>';
	echo '</td>';
	echo '</tr>';

	echo '<tr>';
	echo '<th scope="row"><label for="kiwipress-bridge-preview-path">' . esc_html__( 'Preview path', 'kiwipress-bridge' ) . '</label></th>';
	echo '<td>';
	echo '<input name="' . esc_attr( KIWIPRESS_BRIDGE_OPTION ) . '[preview_path]" id="kiwipress-bridge-preview-path" type="text" class="regular-text code" value="' . esc_attr( $options['preview_path'] ) . '" />';
	echo '<p class="description">' . esc_html__( 'Path on the frontend that renders a draft. It must start with / and must not include a scheme, a host, or //. Default /preview.', 'kiwipress-bridge' ) . '</p>';
	echo '</td>';
	echo '</tr>';

	echo '</tbody></table>';

	submit_button( __( 'Save settings', 'kiwipress-bridge' ) );
	echo '</div>';
	echo '</form>';

	$preview_on = kiwipress_bridge_preview_is_available();
	$example    = kiwipress_bridge_preview_example_url();
	$ttl        = kiwipress_bridge_preview_ttl();

	echo '<div class="card">';
	echo '<h2>' . esc_html__( 'Preview', 'kiwipress-bridge' ) . '</h2>';
	if ( $preview_on ) {
		echo '<div class="notice notice-success inline"><p><strong>' . esc_html__( 'On', 'kiwipress-bridge' ) . '</strong></p></div>';
	} else {
		echo '<div class="notice notice-warning inline"><p><strong>' . esc_html__( 'Off', 'kiwipress-bridge' ) . '</strong></p></div>';
		echo '<p class="description">' . esc_html__( 'Draft preview turns on after KiwiPress pairs this site and a frontend URL is saved. Logged-in editors still see the WordPress theme preview until then.', 'kiwipress-bridge' ) . '</p>';
	}
	if ( $example !== '' ) {
		echo '<p><strong>' . esc_html__( 'Example URL', 'kiwipress-bridge' ) . '</strong><br><code>' . esc_html( $example ) . '</code></p>';
	}
	echo '<p class="description">';
	echo esc_html(
		sprintf(
			/* translators: %d: preview lifetime in seconds */
			__( 'Links last %d seconds (filter kiwipress_bridge_preview_ttl). Revoking rotates the secret and invalidates links that are still inside that window.', 'kiwipress-bridge' ),
			$ttl
		)
	);
	echo '</p>';

	echo '<form id="kiwipress-bridge-revoke" method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
	wp_nonce_field( 'kiwipress_bridge_revoke_preview', 'kiwipress_bridge_revoke_nonce' );
	echo '<input type="hidden" name="action" value="kiwipress_bridge_revoke_preview" />';
	echo '<button type="submit" class="button">' . esc_html__( 'Revoke preview links', 'kiwipress-bridge' ) . '</button>';
	echo '</form>';
	echo '</div>';

	echo '<div class="card">';
	echo '<h2>' . esc_html__( 'Health', 'kiwipress-bridge' ) . '</h2>';
	echo '<p class="description"><code>GET /wp-json/kiwipress/v1/health</code> ';
	echo esc_html__( '(public, no secrets)', 'kiwipress-bridge' );
	echo '</p>';
	echo '<table class="widefat striped"><tbody>';
	kiwipress_bridge_admin_health_row( __( 'Plugin version', 'kiwipress-bridge' ), $health['plugin_version'] );
	kiwipress_bridge_admin_health_row( __( 'WordPress version', 'kiwipress-bridge' ), $health['wp_version'] );
	kiwipress_bridge_admin_health_row( __( 'Lockdown', 'kiwipress-bridge' ), $health['lockdown'] ? __( 'On', 'kiwipress-bridge' ) : __( 'Off', 'kiwipress-bridge' ) );
	kiwipress_bridge_admin_health_row( __( 'Paired', 'kiwipress-bridge' ), $health['paired'] ? __( 'Yes', 'kiwipress-bridge' ) : __( 'No', 'kiwipress-bridge' ) );
	kiwipress_bridge_admin_health_row( __( 'Frontend URL set', 'kiwipress-bridge' ), $health['frontend_url_set'] ? __( 'Yes', 'kiwipress-bridge' ) : __( 'No', 'kiwipress-bridge' ) );
	kiwipress_bridge_admin_health_row( __( 'Site URL', 'kiwipress-bridge' ), $health['site_url'] );
	$features = isset( $health['features'] ) && is_array( $health['features'] ) ? $health['features'] : array();
	kiwipress_bridge_admin_health_row(
		__( 'Features', 'kiwipress-bridge' ),
		$features ? implode( ', ', $features ) : __( 'None', 'kiwipress-bridge' )
	);
	echo '</tbody></table>';
	echo '</div>';

	echo '</div>';
}

/**
 * One label/value row in the health card.
 *
 * @param string $label Row label.
 * @param string $value Row value.
 */
function kiwipress_bridge_admin_health_row( $label, $value ) {
	echo '<tr>';
	echo '<td class="row-title">' . esc_html( $label ) . '</td>';
	echo '<td>' . esc_html( $value ) . '</td>';
	echo '</tr>';
}
