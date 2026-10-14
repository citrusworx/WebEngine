<?php
/**
 * Front-end lockdown.
 *
 * When the option is on, an anonymous visitor to the public theme is sent
 * to frontend_url with a 302. If that URL is empty, or it points back at
 * this same WordPress site, the blank "Headless Mode Activated" template
 * is served instead.
 *
 * Never touches wp-admin, wp-login.php, REST (/wp-json or ?rest_route=),
 * cron, or admin-ajax. Logged-in users still see the theme, so an editor
 * can confirm the install.
 *
 * Seeded from "Activate Headless Mode" (Drew Winkles). That plugin sent
 * non-admins to /404, swapped in a blank template, hid the admin bar, and
 * stubbed REST auth. Three bugs in that seed are fixed here and in rest.php:
 *
 * 1. deactivate_theme_for_headless_mode() never received $template, so the
 *    template_include filter could not hand the original template back.
 *    kiwipress_bridge_lockdown_template() always takes $template and returns
 *    it when this request is not locked.
 * 2. The admin-bar callback was written `__return false` (a space, and not
 *    a function). The WordPress helper is `__return_false`.
 * 3. The REST stub assigned `$restult`, so the computed result was dropped.
 *    See kiwipress_bridge_rest_auth_stub() in includes/rest.php.
 *
 * Preview requests are intentionally not special-cased. See the TODO in
 * kiwipress_bridge_should_lock_front().
 *
 * @package KiwiPressBridge
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Hook lockdown. template_redirect runs early so we can leave before another
 * plugin prints. template_include runs late so the blank file wins over the theme.
 */
function kiwipress_bridge_lockdown_register() {
	add_action( 'template_redirect', 'kiwipress_bridge_lockdown_redirect', 0 );
	add_filter( 'template_include', 'kiwipress_bridge_lockdown_template', 99 );
	add_filter( 'show_admin_bar', 'kiwipress_bridge_filter_admin_bar' );
}

/**
 * 302 anonymous visitors to the frontend when lockdown has a usable URL.
 */
function kiwipress_bridge_lockdown_redirect() {
	$url = kiwipress_bridge_redirect_target();
	if ( $url === '' ) {
		return;
	}

	/*
	 * wp_safe_redirect() refuses hosts that are not this site. The frontend
	 * is a different origin by design, and the URL was already limited to
	 * http(s) when it was saved, so the plain redirect is the right call.
	 */
	wp_redirect( $url, 302, 'KiwiPress Bridge' );
	exit;
}

/**
 * Serve the blank template, or pass the theme template through.
 *
 * This is the fixed form of deactivate_theme_for_headless_mode(): the
 * original omitted $template, so it could not return the theme path.
 *
 * @param string $template Theme template path chosen by WordPress.
 * @return string
 */
function kiwipress_bridge_lockdown_template( $template ) {
	if ( ! kiwipress_bridge_should_serve_blank() ) {
		return $template;
	}

	// A missing permalink would otherwise stay a 404. The blank page is the answer.
	status_header( 200 );

	$blank = KIWIPRESS_BRIDGE_DIR . 'templates/headless.php';
	if ( ! is_readable( $blank ) ) {
		return $template;
	}

	return $blank;
}

/**
 * Hide the front-end toolbar while lockdown is on.
 *
 * The seed plugin passed `__return false`, which is not a callable
 * (`__return_false` is). wp-admin does not use this toolbar, so the
 * dashboard is unaffected.
 *
 * @param bool $show Whether WordPress wants the toolbar.
 * @return bool
 */
function kiwipress_bridge_filter_admin_bar( $show ) {
	if ( ! kiwipress_bridge_get_options()['lockdown'] ) {
		return $show;
	}

	return false;
}

/**
 * URL to send anonymous visitors to, or "" when the blank template should show.
 *
 * @return string
 */
function kiwipress_bridge_redirect_target() {
	if ( ! kiwipress_bridge_should_lock_front() ) {
		return '';
	}

	$url = kiwipress_bridge_get_options()['frontend_url'];
	if ( $url === '' ) {
		return '';
	}

	$url = esc_url_raw( $url );
	if ( $url === '' || kiwipress_bridge_is_self_url( $url ) ) {
		// Redirecting at this same site would loop. Fall through to the blank page.
		return '';
	}

	return $url;
}

/**
 * True when this request should see "Headless Mode Activated" instead of the theme.
 *
 * @return bool
 */
function kiwipress_bridge_should_serve_blank() {
	return kiwipress_bridge_should_lock_front() && kiwipress_bridge_redirect_target() === '';
}

/**
 * True for an anonymous public theme view while lockdown is on.
 *
 * @return bool
 */
function kiwipress_bridge_should_lock_front() {
	if ( ! kiwipress_bridge_get_options()['lockdown'] ) {
		return false;
	}

	if ( kiwipress_bridge_request_is_reserved() ) {
		return false;
	}

	if ( is_user_logged_in() ) {
		return false;
	}

	/*
	 * TODO(B2): preview requests are out of scope. A draft preview
	 * (?preview=true with preview_id / preview_nonce, or a later KiwiPress
	 * preview token) should bypass lockdown. B0 locks every anonymous
	 * front-end hit the same way.
	 */

	return true;
}

/**
 * Paths and request types lockdown must leave alone.
 *
 * REST normally exits during parse_request, before template_redirect, but
 * plain permalinks (?rest_route=) and subdirectory installs are checked by
 * path as well so a funny permalink setup cannot lock /wp-json.
 *
 * @return bool
 */
function kiwipress_bridge_request_is_reserved() {
	if ( is_admin() ) {
		return true;
	}

	if ( wp_doing_ajax() ) {
		return true;
	}

	if ( wp_doing_cron() ) {
		return true;
	}

	if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
		return true;
	}

	// Plain permalinks: /index.php?rest_route=/wp/v2/posts
	if ( isset( $_GET['rest_route'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return true;
	}

	$path = kiwipress_bridge_request_path();
	if ( $path === '' ) {
		return false;
	}

	$segments = array(
		'wp-admin',
		'wp-login.php',
		'wp-json',
		'wp-cron.php',
		'admin-ajax.php',
	);

	foreach ( $segments as $segment ) {
		if ( kiwipress_bridge_path_has_segment( $path, $segment ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Path from REQUEST_URI, without the query string.
 *
 * @return string
 */
function kiwipress_bridge_request_path() {
	$uri = isset( $_SERVER['REQUEST_URI'] ) ? $_SERVER['REQUEST_URI'] : '';
	if ( ! is_string( $uri ) || $uri === '' ) {
		return '';
	}

	$path = wp_parse_url( $uri, PHP_URL_PATH );
	if ( ! is_string( $path ) ) {
		return '';
	}

	return $path;
}

/**
 * Match a path segment at a boundary, including subdirectory installs
 * (/blog/wp-json/...) without matching lookalikes (/wp-json-backup).
 *
 * @param string $path    Request path.
 * @param string $segment Segment such as "wp-json" or "wp-login.php".
 * @return bool
 */
function kiwipress_bridge_path_has_segment( $path, $segment ) {
	$segment = trim( $segment, '/' );
	if ( $segment === '' ) {
		return false;
	}

	if ( $path === '/' . $segment ) {
		return true;
	}

	if ( strpos( $path, '/' . $segment . '/' ) !== false ) {
		return true;
	}

	$suffix = '/' . $segment;
	$length = strlen( $suffix );

	return strlen( $path ) >= $length && substr( $path, -$length ) === $suffix;
}

/**
 * True when $url is this WordPress site's own home or siteurl.
 *
 * @param string $url Absolute URL.
 * @return bool
 */
function kiwipress_bridge_is_self_url( $url ) {
	$target = untrailingslashit( strtolower( $url ) );
	$own    = array(
		untrailingslashit( strtolower( home_url() ) ),
		untrailingslashit( strtolower( get_site_url() ) ),
	);

	return in_array( $target, $own, true );
}
