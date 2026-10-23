<?php
/**
 * Draft preview handoff.
 *
 * WordPress holds the only preview secret (`kiwipress_bridge_preview_secret`,
 * autoload no). It is not part of the `kiwipress_bridge` option, so health,
 * settings, and the wp-admin settings form never return it. KiwiPress does
 * not store it either. Tokens are stateless HMAC values, valid for ten
 * minutes, and checked again when the draft is fetched.
 *
 * A logged-in editor opening any core preview URL (classic, Gutenberg
 * `?preview=true`, autosave `preview_id`, or the list-table Preview link)
 * is sent to `{frontend_url}{preview_path}?kiwipress_preview=<token>` when
 * the site is paired and the frontend URL is usable. Anonymous preview
 * requests go to wp-login and never receive a token. An unpaired site, or
 * one with no usable frontend URL, keeps the B0 theme preview for logged-in
 * users.
 *
 * @package KiwiPressBridge
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Query parameter on the KiwiPress frontend. */
define( 'KIWIPRESS_BRIDGE_PREVIEW_QUERY', 'kiwipress_preview' );

/** Request header on `GET /kiwipress/v1/preview`. */
define( 'KIWIPRESS_BRIDGE_PREVIEW_HEADER', 'X-KiwiPress-Preview' );

/**
 * Wire the handoff, REST routes, secret rotation, and the revoke action.
 */
function kiwipress_bridge_preview_register() {
	// Before lockdown (priority 0) and before redirect_canonical (priority 10).
	add_action( 'template_redirect', 'kiwipress_bridge_preview_handoff', -1 );
	add_action( 'rest_api_init', 'kiwipress_bridge_register_preview_routes' );
	add_filter( 'rest_post_dispatch', 'kiwipress_bridge_preview_response_headers', 10, 3 );
	add_action( 'admin_post_kiwipress_bridge_revoke_preview', 'kiwipress_bridge_handle_revoke_preview' );
	add_action( 'update_option_' . KIWIPRESS_BRIDGE_OPTION, 'kiwipress_bridge_rotate_preview_on_unpair', 10, 2 );
}

/**
 * Create the secret on activation when the row is missing.
 *
 * In-place upgrades from 0.1.0 do not run the activation hook, so mint and
 * verify also create it on first use.
 *
 * @return string Stored secret (64 hex characters), or "" when generation failed.
 */
function kiwipress_bridge_ensure_preview_secret() {
	$stored = get_option( KIWIPRESS_BRIDGE_PREVIEW_SECRET_OPTION, null );
	if ( is_string( $stored ) && kiwipress_bridge_stored_secret_is_valid( $stored ) ) {
		return $stored;
	}

	return kiwipress_bridge_rotate_preview_secret();
}

/**
 * Replace the stored secret. Outstanding tokens stop verifying.
 *
 * A `KIWIPRESS_PREVIEW_SECRET` constant in wp-config still wins for signing
 * until that constant itself changes. The stored row is rotated anyway so
 * removing the constant does not resurrect the previous secret.
 *
 * @return string New stored secret, or "" when random_bytes failed.
 */
function kiwipress_bridge_rotate_preview_secret() {
	try {
		$secret = bin2hex( random_bytes( 32 ) );
	} catch ( Exception $error ) {
		return '';
	}

	// Hex, not raw bytes: the options table is utf8mb4 and would reject or
	// mangle 32 random bytes. The value is still 32 bytes of entropy.
	update_option( KIWIPRESS_BRIDGE_PREVIEW_SECRET_OPTION, $secret, false );

	return $secret;
}

/**
 * @param mixed $stored Option value.
 * @return bool
 */
function kiwipress_bridge_stored_secret_is_valid( $stored ) {
	return is_string( $stored ) && 1 === preg_match( '/^[a-f0-9]{64}$/', $stored );
}

/**
 * Bytes used as the HMAC key input.
 *
 * The wp-config constant, when set to a non-empty string, overrides the
 * option. A 64-character hex string is decoded to 32 bytes. Any other
 * non-empty string is used as the raw key material (a passphrase or 32
 * raw bytes).
 *
 * @return string
 */
function kiwipress_bridge_preview_secret_material() {
	if ( defined( 'KIWIPRESS_PREVIEW_SECRET' ) ) {
		$constant = constant( 'KIWIPRESS_PREVIEW_SECRET' );
		if ( is_string( $constant ) && $constant !== '' ) {
			return kiwipress_bridge_secret_bytes( $constant );
		}
	}

	$stored = kiwipress_bridge_ensure_preview_secret();
	if ( $stored === '' ) {
		return '';
	}

	return kiwipress_bridge_secret_bytes( $stored );
}

/**
 * @param string $stored Hex, raw bytes, or a passphrase.
 * @return string
 */
function kiwipress_bridge_secret_bytes( $stored ) {
	if ( kiwipress_bridge_stored_secret_is_valid( $stored ) ) {
		$raw = hex2bin( $stored );
		if ( is_string( $raw ) && strlen( $raw ) === 32 ) {
			return $raw;
		}
	}

	return $stored;
}

/**
 * Derived signing key. Empty when no secret material is available.
 *
 * @return string Raw SHA-256 HMAC, or "".
 */
function kiwipress_bridge_preview_signing_key() {
	$secret = kiwipress_bridge_preview_secret_material();
	if ( $secret === '' ) {
		return '';
	}

	return hash_hmac( 'sha256', 'kiwipress-preview-v1', $secret, true );
}

/**
 * Filter `kiwipress_bridge_preview_ttl`. Default is 10 minutes.
 *
 * A negative value is kept so a test can mint a token that is already
 * outside the 30 second expiry skew.
 *
 * @return int Seconds from iat until exp.
 */
function kiwipress_bridge_preview_ttl() {
	$ttl = apply_filters( 'kiwipress_bridge_preview_ttl', 10 * MINUTE_IN_SECONDS );
	if ( is_int( $ttl ) ) {
		return $ttl;
	}
	if ( is_float( $ttl ) || ( is_string( $ttl ) && is_numeric( $ttl ) ) ) {
		return (int) $ttl;
	}

	return 10 * MINUTE_IN_SECONDS;
}

/**
 * Paired, with a frontend URL that is not this WordPress site.
 *
 * @return bool
 */
function kiwipress_bridge_preview_is_available() {
	$options = kiwipress_bridge_get_options();
	if ( empty( $options['paired'] ) ) {
		return false;
	}

	return kiwipress_bridge_preview_frontend_base() !== '';
}

/**
 * Absolute frontend origin+path with no trailing slash, or "".
 *
 * @return string
 */
function kiwipress_bridge_preview_frontend_base() {
	$url = kiwipress_bridge_get_options()['frontend_url'];
	if ( ! is_string( $url ) || $url === '' ) {
		return '';
	}

	$url = esc_url_raw( $url );
	if ( $url === '' || kiwipress_bridge_is_self_url( $url ) ) {
		return '';
	}

	return untrailingslashit( $url );
}

/**
 * Example the status screen can show. No token, no secret.
 *
 * @return string
 */
function kiwipress_bridge_preview_example_url() {
	$base = kiwipress_bridge_preview_frontend_base();
	if ( $base === '' ) {
		return '';
	}

	return $base . kiwipress_bridge_get_options()['preview_path'] . '?' . KIWIPRESS_BRIDGE_PREVIEW_QUERY . '=…';
}

/**
 * Rotate when pairing flips from true to false.
 *
 * Fires for REST unpair, wp-cli `update_option`, and any other writer.
 * Saving the wp-admin form does not change `paired`, so it does not rotate.
 *
 * @param mixed $old_value Previous option value.
 * @param mixed $value     New option value.
 */
function kiwipress_bridge_rotate_preview_on_unpair( $old_value, $value ) {
	$was = is_array( $old_value ) && ! empty( $old_value['paired'] );
	$now = is_array( $value ) && ! empty( $value['paired'] );
	if ( $was && ! $now ) {
		kiwipress_bridge_rotate_preview_secret();
	}
}

/**
 * admin-post.php handler for the "Revoke preview links" button.
 */
function kiwipress_bridge_handle_revoke_preview() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Sorry, you are not allowed to revoke preview links.', 'kiwipress-bridge' ), '', array( 'response' => 403 ) );
	}

	check_admin_referer( 'kiwipress_bridge_revoke_preview', 'kiwipress_bridge_revoke_nonce' );
	kiwipress_bridge_rotate_preview_secret();

	wp_safe_redirect(
		add_query_arg(
			'preview-revoked',
			'1',
			admin_url( 'admin.php?page=kiwipress-bridge' )
		)
	);
	exit;
}

/**
 * Catch core preview requests before lockdown redirects them.
 */
function kiwipress_bridge_preview_handoff() {
	if ( ! kiwipress_bridge_request_is_preview() ) {
		return;
	}

	if ( ! is_user_logged_in() ) {
		nocache_headers();
		header( 'Referrer-Policy: no-referrer' );
		wp_safe_redirect( wp_login_url( kiwipress_bridge_current_url() ) );
		exit;
	}

	// Unpaired, or no frontend to send the editor to: B0 theme preview.
	if ( ! kiwipress_bridge_preview_is_available() ) {
		return;
	}

	$post_id = kiwipress_bridge_preview_requested_post_id();
	if ( $post_id <= 0 || ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	$post = get_post( $post_id );
	if ( ! $post instanceof WP_Post ) {
		return;
	}

	$source = 'post';
	if ( kiwipress_bridge_preview_request_id() > 0 ) {
		$source = 'autosave';
	}

	$minted = kiwipress_bridge_mint_preview_token( $post, $source, get_current_user_id() );
	if ( is_wp_error( $minted ) ) {
		return;
	}

	nocache_headers();
	header( 'Referrer-Policy: no-referrer' );
	wp_redirect( $minted['url'], 302, 'KiwiPress Bridge' );
	exit;
}

/**
 * True for core preview URLs, including ones WordPress has not flagged yet.
 *
 * @return bool
 */
function kiwipress_bridge_request_is_preview() {
	if ( function_exists( 'is_preview' ) && is_preview() ) {
		return true;
	}

	$preview = get_query_var( 'preview' );
	if ( $preview && '0' !== (string) $preview && 'false' !== (string) $preview ) {
		return true;
	}

	if ( ! isset( $_GET['preview'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return false;
	}

	$value = wp_unslash( $_GET['preview'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( is_array( $value ) ) {
		return false;
	}

	$value = strtolower( trim( (string) $value ) );

	return $value !== '' && '0' !== $value && 'false' !== $value;
}

/**
 * `preview_id` when this is an autosave preview, else 0.
 *
 * @return int
 */
function kiwipress_bridge_preview_request_id() {
	if ( ! isset( $_GET['preview_id'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return 0;
	}

	$value = wp_unslash( $_GET['preview_id'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( is_array( $value ) ) {
		return 0;
	}

	return (int) $value;
}

/**
 * Post the preview is for. `preview_id` wins, then the main query, then `p` / `page_id`.
 *
 * @return int
 */
function kiwipress_bridge_preview_requested_post_id() {
	$preview_id = kiwipress_bridge_preview_request_id();
	if ( $preview_id > 0 ) {
		return $preview_id;
	}

	$queried = (int) get_queried_object_id();
	if ( $queried > 0 ) {
		return $queried;
	}

	foreach ( array( 'p', 'page_id' ) as $key ) {
		$id = (int) get_query_var( $key );
		if ( $id > 0 ) {
			return $id;
		}
		if ( isset( $_GET[ $key ] ) && ! is_array( $_GET[ $key ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$id = (int) wp_unslash( $_GET[ $key ] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			if ( $id > 0 ) {
				return $id;
			}
		}
	}

	return 0;
}

/**
 * Absolute URL of this front-end request, using the configured home host.
 *
 * @return string
 */
function kiwipress_bridge_current_url() {
	$home  = home_url( '/' );
	$parts = wp_parse_url( $home );
	$scheme = ( is_array( $parts ) && isset( $parts['scheme'] ) ) ? (string) $parts['scheme'] : 'http';
	$host   = ( is_array( $parts ) && isset( $parts['host'] ) ) ? (string) $parts['host'] : 'localhost';
	$port   = ( is_array( $parts ) && isset( $parts['port'] ) ) ? ':' . (int) $parts['port'] : '';

	$uri = '/';
	if ( isset( $_SERVER['REQUEST_URI'] ) && is_string( $_SERVER['REQUEST_URI'] ) && $_SERVER['REQUEST_URI'] !== '' ) {
		$uri = wp_unslash( $_SERVER['REQUEST_URI'] );
	}
	if ( $uri === '' || $uri[0] !== '/' ) {
		$uri = '/' . ltrim( (string) $uri, '/' );
	}

	return $scheme . '://' . $host . $port . $uri;
}

/**
 * @param WP_Post $post   Post the editor can edit.
 * @param string  $source `post` or `autosave`.
 * @param int     $user_id WordPress user id embedded in the token.
 * @return array{token:string,url:string,expires_at:string}|WP_Error
 */
function kiwipress_bridge_mint_preview_token( WP_Post $post, $source, $user_id ) {
	if ( 'post' !== $source && 'autosave' !== $source ) {
		return new WP_Error(
			'kiwipress_bridge_invalid_preview_source',
			__( 'Preview source must be post or autosave.', 'kiwipress-bridge' ),
			array( 'status' => 400 )
		);
	}

	if ( ! kiwipress_bridge_preview_is_available() ) {
		return new WP_Error(
			'kiwipress_bridge_preview_disabled',
			__( 'Draft preview is off until this site is paired and has a frontend URL.', 'kiwipress-bridge' ),
			array( 'status' => 403 )
		);
	}

	$key = kiwipress_bridge_preview_signing_key();
	if ( $key === '' ) {
		return new WP_Error(
			'kiwipress_bridge_preview_disabled',
			__( 'Draft preview is off until this site is paired and has a frontend URL.', 'kiwipress-bridge' ),
			array( 'status' => 403 )
		);
	}

	try {
		$jti = bin2hex( random_bytes( 16 ) );
	} catch ( Exception $error ) {
		return new WP_Error(
			'kiwipress_bridge_preview_invalid',
			__( 'Could not build a preview token.', 'kiwipress-bridge' ),
			array( 'status' => 500 )
		);
	}

	$issued = time();
	$claims = array(
		'v'   => 1,
		'iss' => untrailingslashit( get_site_url() ),
		'pid' => (int) $post->ID,
		'pt'  => (string) $post->post_type,
		'src' => $source,
		'uid' => (int) $user_id,
		'iat' => $issued,
		'exp' => $issued + kiwipress_bridge_preview_ttl(),
		'jti' => $jti,
	);

	$payload = wp_json_encode( $claims );
	if ( ! is_string( $payload ) || $payload === '' ) {
		return new WP_Error(
			'kiwipress_bridge_preview_invalid',
			__( 'Could not build a preview token.', 'kiwipress-bridge' ),
			array( 'status' => 500 )
		);
	}

	$signing_input = 'kp1.' . kiwipress_bridge_b64url_encode( $payload );
	$signature     = hash_hmac( 'sha256', $signing_input, $key, true );
	$token         = $signing_input . '.' . kiwipress_bridge_b64url_encode( $signature );
	$url           = kiwipress_bridge_preview_frontend_base()
		. kiwipress_bridge_get_options()['preview_path']
		. '?' . KIWIPRESS_BRIDGE_PREVIEW_QUERY . '=' . rawurlencode( $token );

	return array(
		'token'      => $token,
		'url'        => $url,
		'expires_at' => gmdate( 'c', (int) $claims['exp'] ),
	);
}

/**
 * Verify a token. Does not switch the current user.
 *
 * Order: structure, signature, claim shape, expiry (30s skew), paired,
 * post exists and is exposed over REST, and the embedded user can still edit it.
 *
 * @param string $token Raw `kp1.` token.
 * @return array{v:int,iss:string,pid:int,pt:string,src:string,uid:int,iat:int,exp:int,jti:string}|WP_Error
 */
function kiwipress_bridge_verify_preview_token( $token ) {
	if ( ! is_string( $token ) ) {
		return kiwipress_bridge_preview_error( 'kiwipress_bridge_preview_missing', __( 'Preview token is missing.', 'kiwipress-bridge' ), 401 );
	}

	$token = trim( $token );
	if ( $token === '' ) {
		return kiwipress_bridge_preview_error( 'kiwipress_bridge_preview_missing', __( 'Preview token is missing.', 'kiwipress-bridge' ), 401 );
	}

	$parts = explode( '.', $token );
	if ( count( $parts ) !== 3 || 'kp1' !== $parts[0] || $parts[1] === '' || $parts[2] === '' ) {
		return kiwipress_bridge_preview_error( 'kiwipress_bridge_preview_invalid', __( 'Preview token is not valid.', 'kiwipress-bridge' ), 401 );
	}

	$key = kiwipress_bridge_preview_signing_key();
	$signature = kiwipress_bridge_b64url_decode( $parts[2] );
	if ( $key === '' || ! is_string( $signature ) || strlen( $signature ) !== 32 ) {
		return kiwipress_bridge_preview_error( 'kiwipress_bridge_preview_invalid', __( 'Preview token is not valid.', 'kiwipress-bridge' ), 401 );
	}

	$expected = hash_hmac( 'sha256', 'kp1.' . $parts[1], $key, true );
	if ( ! is_string( $expected ) || ! hash_equals( $expected, $signature ) ) {
		return kiwipress_bridge_preview_error( 'kiwipress_bridge_preview_invalid', __( 'Preview token is not valid.', 'kiwipress-bridge' ), 401 );
	}

	$json = kiwipress_bridge_b64url_decode( $parts[1] );
	$claims = is_string( $json ) ? json_decode( $json, true ) : null;
	if ( ! is_array( $claims ) || ! kiwipress_bridge_preview_claims_shape( $claims ) ) {
		return kiwipress_bridge_preview_error( 'kiwipress_bridge_preview_invalid', __( 'Preview token is not valid.', 'kiwipress-bridge' ), 401 );
	}

	if ( time() > ( (int) $claims['exp'] + 30 ) ) {
		return kiwipress_bridge_preview_error( 'kiwipress_bridge_preview_expired', __( 'Preview token has expired.', 'kiwipress-bridge' ), 401 );
	}

	$issuer = untrailingslashit( strtolower( (string) $claims['iss'] ) );
	$site   = untrailingslashit( strtolower( get_site_url() ) );
	if ( $issuer === '' || $issuer !== $site ) {
		return kiwipress_bridge_preview_error( 'kiwipress_bridge_preview_invalid', __( 'Preview token is not valid.', 'kiwipress-bridge' ), 401 );
	}

	if ( empty( kiwipress_bridge_get_options()['paired'] ) ) {
		return kiwipress_bridge_preview_error(
			'kiwipress_bridge_preview_disabled',
			__( 'Draft preview is off because this site is not paired.', 'kiwipress-bridge' ),
			403
		);
	}

	$post = get_post( (int) $claims['pid'] );
	if ( ! $post instanceof WP_Post || 'trash' === $post->post_status || $post->post_type !== $claims['pt'] ) {
		return kiwipress_bridge_preview_error( 'kiwipress_bridge_preview_not_found', __( 'That preview item was not found.', 'kiwipress-bridge' ), 404 );
	}

	$object = get_post_type_object( $post->post_type );
	if ( ! $object || empty( $object->show_in_rest ) ) {
		return kiwipress_bridge_preview_error( 'kiwipress_bridge_preview_not_found', __( 'That preview item was not found.', 'kiwipress-bridge' ), 404 );
	}

	if ( ! user_can( (int) $claims['uid'], 'edit_post', (int) $post->ID ) ) {
		return kiwipress_bridge_preview_error(
			'kiwipress_bridge_preview_forbidden',
			__( 'You can no longer preview this item.', 'kiwipress-bridge' ),
			403
		);
	}

	return array(
		'v'   => 1,
		'iss' => (string) $claims['iss'],
		'pid' => (int) $claims['pid'],
		'pt'  => (string) $claims['pt'],
		'src' => (string) $claims['src'],
		'uid' => (int) $claims['uid'],
		'iat' => (int) $claims['iat'],
		'exp' => (int) $claims['exp'],
		'jti' => (string) $claims['jti'],
	);
}

/**
 * @param array<mixed> $claims Decoded JSON.
 * @return bool
 */
function kiwipress_bridge_preview_claims_shape( array $claims ) {
	if ( ! isset( $claims['v'], $claims['iss'], $claims['pid'], $claims['pt'], $claims['src'], $claims['uid'], $claims['iat'], $claims['exp'], $claims['jti'] ) ) {
		return false;
	}

	if ( ! is_int( $claims['v'] ) || 1 !== $claims['v'] ) {
		return false;
	}
	if ( ! is_string( $claims['iss'] ) || $claims['iss'] === '' ) {
		return false;
	}
	if ( ! is_int( $claims['pid'] ) || $claims['pid'] <= 0 ) {
		return false;
	}
	if ( ! is_string( $claims['pt'] ) || ! preg_match( '/^[A-Za-z0-9_-]{1,20}$/', $claims['pt'] ) ) {
		return false;
	}
	if ( 'post' !== $claims['src'] && 'autosave' !== $claims['src'] ) {
		return false;
	}
	if ( ! is_int( $claims['uid'] ) || $claims['uid'] <= 0 ) {
		return false;
	}
	if ( ! is_int( $claims['iat'] ) || ! is_int( $claims['exp'] ) ) {
		return false;
	}
	if ( ! is_string( $claims['jti'] ) || $claims['jti'] === '' || strlen( $claims['jti'] ) > 80 ) {
		return false;
	}

	return true;
}

/**
 * @param string $code    Machine code.
 * @param string $message Human message.
 * @param int    $status  HTTP status.
 * @return WP_Error
 */
function kiwipress_bridge_preview_error( $code, $message, $status ) {
	return new WP_Error( $code, $message, array( 'status' => (int) $status ) );
}

/**
 * @param string $bytes Raw bytes.
 * @return string
 */
function kiwipress_bridge_b64url_encode( $bytes ) {
	return rtrim( strtr( base64_encode( $bytes ), '+/', '-_' ), '=' );
}

/**
 * @param string $text Base64url text.
 * @return string|false
 */
function kiwipress_bridge_b64url_decode( $text ) {
	if ( ! is_string( $text ) || $text === '' || ! preg_match( '/^[A-Za-z0-9_-]+$/', $text ) ) {
		return false;
	}

	$mapped = strtr( $text, '-_', '+/' );
	$pad    = strlen( $mapped ) % 4;
	if ( 0 !== $pad ) {
		$mapped .= str_repeat( '=', 4 - $pad );
	}

	return base64_decode( $mapped, true );
}

/**
 * Claims for the current REST preview request, if permission already verified them.
 *
 * @param array<string,mixed>|null $claims Pass null to clear. Omit to read.
 * @return array<string,mixed>|null
 */
function kiwipress_bridge_preview_claims_box( $claims = null ) {
	static $stored = null;
	if ( func_num_args() > 0 ) {
		$stored = $claims;
	}

	return $stored;
}

/**
 * REST: public read of one preview, and an authenticated mint.
 */
function kiwipress_bridge_register_preview_routes() {
	register_rest_route(
		'kiwipress/v1',
		'/preview',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'kiwipress_bridge_rest_preview',
			'permission_callback' => 'kiwipress_bridge_rest_preview_permission',
		)
	);

	register_rest_route(
		'kiwipress/v1',
		'/preview/token',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'kiwipress_bridge_rest_preview_token',
			'permission_callback' => 'kiwipress_bridge_rest_preview_token_permission',
			'args'                => array(
				'post_id' => array(
					'required'          => true,
					'type'              => 'integer',
					'sanitize_callback' => 'absint',
				),
				'source'  => array(
					'required' => false,
					'type'     => 'string',
					'default'  => 'auto',
				),
			),
		)
	);
}

/**
 * The token header is the credential. No application password.
 *
 * @param WP_REST_Request $request Incoming request.
 * @return true|WP_Error
 */
function kiwipress_bridge_rest_preview_permission( WP_REST_Request $request ) {
	kiwipress_bridge_preview_claims_box( null );

	$header = $request->get_header( KIWIPRESS_BRIDGE_PREVIEW_HEADER );
	if ( is_array( $header ) ) {
		$header = reset( $header );
	}
	if ( ! is_string( $header ) || trim( $header ) === '' ) {
		return kiwipress_bridge_preview_error( 'kiwipress_bridge_preview_missing', __( 'Preview token is missing.', 'kiwipress-bridge' ), 401 );
	}

	$claims = kiwipress_bridge_verify_preview_token( $header );
	if ( is_wp_error( $claims ) ) {
		return $claims;
	}

	kiwipress_bridge_preview_claims_box( $claims );

	return true;
}

/**
 * Editors only. A subscriber is logged in and gets WordPress's 403.
 * A request with no user gets 401.
 *
 * @param WP_REST_Request $request Incoming request.
 * @return bool
 */
function kiwipress_bridge_rest_preview_token_permission( WP_REST_Request $request ) {
	$post_id = absint( $request->get_param( 'post_id' ) );
	if ( $post_id <= 0 ) {
		return false;
	}

	return current_user_can( 'edit_post', $post_id );
}

/**
 * GET /kiwipress/v1/preview
 *
 * @param WP_REST_Request $request Incoming request.
 * @return WP_REST_Response|WP_Error
 */
function kiwipress_bridge_rest_preview( WP_REST_Request $request ) {
	unset( $request );
	$claims = kiwipress_bridge_preview_claims_box();
	if ( ! is_array( $claims ) ) {
		return kiwipress_bridge_preview_error( 'kiwipress_bridge_preview_invalid', __( 'Preview token is not valid.', 'kiwipress-bridge' ), 401 );
	}

	$previous = get_current_user_id();
	wp_set_current_user( (int) $claims['uid'] );

	try {
		return kiwipress_bridge_preview_document( $claims );
	} finally {
		wp_set_current_user( $previous );
		kiwipress_bridge_preview_claims_box( null );
	}
}

/**
 * Load the post over its own REST route and overlay an autosave when asked.
 *
 * @param array{v:int,iss:string,pid:int,pt:string,src:string,uid:int,iat:int,exp:int,jti:string} $claims Verified claims.
 * @return WP_REST_Response|WP_Error
 */
function kiwipress_bridge_preview_document( array $claims ) {
	$route = kiwipress_bridge_preview_rest_route( $claims['pt'], $claims['pid'] );
	if ( $route === '' ) {
		return kiwipress_bridge_preview_error( 'kiwipress_bridge_preview_not_found', __( 'That preview item was not found.', 'kiwipress-bridge' ), 404 );
	}

	$internal = new WP_REST_Request( 'GET', $route );
	$internal->set_param( 'id', (int) $claims['pid'] );
	$internal->set_param( 'context', 'view' );
	$internal->set_query_params(
		array(
			'context' => 'view',
		)
	);

	$response = rest_do_request( $internal );
	if ( $response->is_error() ) {
		$error  = $response->as_error();
		$data   = $error->get_error_data();
		$status = ( is_array( $data ) && isset( $data['status'] ) ) ? (int) $data['status'] : 404;
		if ( 404 === $status ) {
			return kiwipress_bridge_preview_error( 'kiwipress_bridge_preview_not_found', __( 'That preview item was not found.', 'kiwipress-bridge' ), 404 );
		}
		if ( 401 === $status || 403 === $status ) {
			return kiwipress_bridge_preview_error( 'kiwipress_bridge_preview_forbidden', __( 'You can no longer preview this item.', 'kiwipress-bridge' ), 403 );
		}

		return $error;
	}

	$post = $response->get_data();
	if ( ! is_array( $post ) ) {
		return kiwipress_bridge_preview_error( 'kiwipress_bridge_preview_not_found', __( 'That preview item was not found.', 'kiwipress-bridge' ), 404 );
	}

	if ( 'autosave' === $claims['src'] ) {
		$post = kiwipress_bridge_overlay_autosave( (int) $claims['pid'], (int) $claims['uid'], $post );
	}

	return rest_ensure_response(
		array(
			'preview'    => true,
			'source'     => $claims['src'],
			'post_id'    => (int) $claims['pid'],
			'post_type'  => $claims['pt'],
			'expires_at' => gmdate( 'c', (int) $claims['exp'] ),
			'post'       => $post,
		)
	);
}

/**
 * `/wp/v2/posts/123` for this post type, or "" when it is not in REST.
 *
 * @param string $post_type Post type slug.
 * @param int    $post_id   Post id.
 * @return string
 */
function kiwipress_bridge_preview_rest_route( $post_type, $post_id ) {
	$object = get_post_type_object( $post_type );
	if ( ! $object || empty( $object->show_in_rest ) ) {
		return '';
	}

	$namespace = ! empty( $object->rest_namespace ) ? (string) $object->rest_namespace : 'wp/v2';
	$base      = ! empty( $object->rest_base ) ? (string) $object->rest_base : (string) $post_type;
	$namespace = trim( $namespace, '/' );
	$base      = trim( $base, '/' );
	if ( $namespace === '' || $base === '' || false !== strpos( $base, '/' ) || false !== strpos( $namespace, '..' ) ) {
		return '';
	}

	return '/' . $namespace . '/' . $base . '/' . (int) $post_id;
}

/**
 * Replace title, content, excerpt, and modified with the latest autosave.
 *
 * The token user's autosave wins. If they have none, the latest autosave
 * for the post is used. With no autosave at all the saved post is returned.
 *
 * @param int                  $post_id Post id.
 * @param int                  $user_id Token user.
 * @param array<string,mixed>  $data    REST post representation.
 * @return array<string,mixed>
 */
function kiwipress_bridge_overlay_autosave( $post_id, $user_id, array $data ) {
	$autosave = wp_get_post_autosave( $post_id, $user_id );
	if ( ! $autosave instanceof WP_Post ) {
		$autosave = wp_get_post_autosave( $post_id );
	}
	if ( ! $autosave instanceof WP_Post ) {
		return $data;
	}

	$previous = isset( $GLOBALS['post'] ) ? $GLOBALS['post'] : null;
	$GLOBALS['post'] = $autosave;
	setup_postdata( $autosave );

	if ( isset( $data['title'] ) && is_array( $data['title'] ) ) {
		$data['title']['raw']      = $autosave->post_title;
		$data['title']['rendered'] = apply_filters( 'the_title', $autosave->post_title, $autosave->ID );
	}
	if ( isset( $data['content'] ) && is_array( $data['content'] ) ) {
		$data['content']['raw']      = $autosave->post_content;
		$data['content']['rendered'] = apply_filters( 'the_content', $autosave->post_content );
	}
	if ( isset( $data['excerpt'] ) && is_array( $data['excerpt'] ) ) {
		$data['excerpt']['raw'] = $autosave->post_excerpt;
		$excerpt                = $autosave->post_excerpt;
		if ( $excerpt === '' ) {
			$excerpt = wp_trim_words( wp_strip_all_tags( strip_shortcodes( $autosave->post_content ) ), 55, ' […]' );
		}
		$data['excerpt']['rendered'] = apply_filters( 'the_excerpt', $excerpt );
	}

	$data['modified']     = mysql_to_rfc3339( $autosave->post_modified );
	$data['modified_gmt'] = mysql_to_rfc3339( $autosave->post_modified_gmt );

	wp_reset_postdata();
	if ( $previous instanceof WP_Post ) {
		$GLOBALS['post'] = $previous;
		setup_postdata( $previous );
	}

	return $data;
}

/**
 * `no-store` and `noindex` on success and on token errors.
 *
 * @param WP_HTTP_Response $result  Response WordPress is about to send.
 * @param WP_REST_Server   $server  REST server.
 * @param WP_REST_Request  $request Request.
 * @return WP_HTTP_Response
 */
function kiwipress_bridge_preview_response_headers( $result, $server, $request ) {
	unset( $server );
	if ( ! $request instanceof WP_REST_Request || '/kiwipress/v1/preview' !== $request->get_route() ) {
		return $result;
	}
	if ( $result instanceof WP_REST_Response ) {
		$result->header( 'Cache-Control', 'no-store, private' );
		$result->header( 'X-Robots-Tag', 'noindex' );
	}

	return $result;
}

/**
 * POST /kiwipress/v1/preview/token
 *
 * `source` is `auto` (autosave when one exists, otherwise the post),
 * `post`, or `autosave`.
 *
 * @param WP_REST_Request $request Incoming request.
 * @return WP_REST_Response|WP_Error
 */
function kiwipress_bridge_rest_preview_token( WP_REST_Request $request ) {
	$post_id = absint( $request->get_param( 'post_id' ) );
	$post    = get_post( $post_id );
	if ( ! $post instanceof WP_Post || 'trash' === $post->post_status ) {
		return kiwipress_bridge_preview_error( 'kiwipress_bridge_preview_not_found', __( 'That preview item was not found.', 'kiwipress-bridge' ), 404 );
	}

	$source = $request->get_param( 'source' );
	if ( ! is_string( $source ) || $source === '' ) {
		$source = 'auto';
	}

	$resolved = kiwipress_bridge_resolve_preview_source( $source, $post_id, get_current_user_id() );
	if ( is_wp_error( $resolved ) ) {
		return $resolved;
	}

	$minted = kiwipress_bridge_mint_preview_token( $post, $resolved, get_current_user_id() );
	if ( is_wp_error( $minted ) ) {
		return $minted;
	}

	return rest_ensure_response( $minted );
}

/**
 * @param string $source  Requested source.
 * @param int    $post_id Post id.
 * @param int    $user_id Current user.
 * @return string|WP_Error `post` or `autosave`.
 */
function kiwipress_bridge_resolve_preview_source( $source, $post_id, $user_id ) {
	if ( 'post' === $source ) {
		return 'post';
	}
	if ( 'autosave' === $source ) {
		return 'autosave';
	}
	if ( 'auto' !== $source ) {
		return new WP_Error(
			'kiwipress_bridge_invalid_preview_source',
			__( 'source must be auto, post, or autosave.', 'kiwipress-bridge' ),
			array( 'status' => 400 )
		);
	}

	$autosave = wp_get_post_autosave( $post_id, $user_id );
	if ( ! $autosave instanceof WP_Post ) {
		$autosave = wp_get_post_autosave( $post_id );
	}

	return $autosave instanceof WP_Post ? 'autosave' : 'post';
}
