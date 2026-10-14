<?php
/**
 * REST routes under kiwipress/v1.
 *
 *   GET  /health    public. Version and flags only. No secrets, no frontend URL.
 *   GET  /settings  manage_options. The saved option.
 *   POST /settings  manage_options. Partial update of the four option fields.
 *
 * Application passwords work because WordPress authenticates them before
 * permission_callback runs. A user who can manage_options (typically an
 * Administrator) may read and write settings. Content is not served here;
 * KiwiPress keeps using core /wp/v2 for that.
 *
 * @package KiwiPressBridge
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register routes and the corrected REST auth stub.
 */
function kiwipress_bridge_rest_register() {
	add_action( 'rest_api_init', 'kiwipress_bridge_register_routes' );
	add_filter( 'rest_authentication_errors', 'kiwipress_bridge_rest_auth_stub' );
}

/**
 * Pass REST authentication through unchanged.
 *
 * Seed bug: "Activate Headless Mode" hooked this filter and wrote the
 * outcome to `$restult`, so the value was never returned. B0 does not add
 * an auth scheme. Health is public, settings rely on core manage_options,
 * and a stub that returns $result keeps that contract obvious.
 *
 * @param mixed $result Whatever an earlier callback decided. Often null.
 * @return mixed
 */
function kiwipress_bridge_rest_auth_stub( $result ) {
	return $result;
}

/**
 * Route map. Registered on rest_api_init.
 */
function kiwipress_bridge_register_routes() {
	register_rest_route(
		'kiwipress/v1',
		'/health',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'kiwipress_bridge_rest_health',
			'permission_callback' => '__return_true',
		)
	);

	register_rest_route(
		'kiwipress/v1',
		'/settings',
		array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => 'kiwipress_bridge_rest_get_settings',
				'permission_callback' => 'kiwipress_bridge_rest_can_manage',
			),
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => 'kiwipress_bridge_rest_update_settings',
				'permission_callback' => 'kiwipress_bridge_rest_can_manage',
			),
		)
	);
}

/**
 * Administrators, including those signed in with an application password.
 *
 * @return bool
 */
function kiwipress_bridge_rest_can_manage() {
	return current_user_can( 'manage_options' );
}

/**
 * GET /kiwipress/v1/health
 *
 * @return WP_REST_Response
 */
function kiwipress_bridge_rest_health() {
	return rest_ensure_response( kiwipress_bridge_health_payload() );
}

/**
 * GET /kiwipress/v1/settings
 *
 * @return WP_REST_Response
 */
function kiwipress_bridge_rest_get_settings() {
	return rest_ensure_response( kiwipress_bridge_settings_payload() );
}

/**
 * POST /kiwipress/v1/settings
 *
 * Keys omitted from the body stay as they are. Unknown keys are ignored.
 * There is no webhook, preview token, or content payload on this route.
 *
 * @param WP_REST_Request $request Incoming request.
 * @return WP_REST_Response|WP_Error
 */
function kiwipress_bridge_rest_update_settings( WP_REST_Request $request ) {
	$params = kiwipress_bridge_rest_body( $request );
	if ( is_wp_error( $params ) ) {
		return $params;
	}

	$next = kiwipress_bridge_get_options();

	if ( array_key_exists( 'frontend_url', $params ) ) {
		$url = kiwipress_bridge_sanitize_frontend_url( $params['frontend_url'] );
		if ( is_wp_error( $url ) ) {
			return $url;
		}
		$next['frontend_url'] = $url;
	}

	if ( array_key_exists( 'lockdown', $params ) ) {
		$lockdown = kiwipress_bridge_sanitize_bool( $params['lockdown'] );
		if ( is_wp_error( $lockdown ) ) {
			return kiwipress_bridge_rest_field_error( $lockdown, 'lockdown' );
		}
		$next['lockdown'] = $lockdown;
	}

	if ( array_key_exists( 'paired', $params ) ) {
		$paired = kiwipress_bridge_sanitize_bool( $params['paired'] );
		if ( is_wp_error( $paired ) ) {
			return kiwipress_bridge_rest_field_error( $paired, 'paired' );
		}
		$next['paired'] = $paired;
	}

	if ( array_key_exists( 'project_label', $params ) ) {
		$label = kiwipress_bridge_sanitize_project_label( $params['project_label'] );
		if ( is_wp_error( $label ) ) {
			return $label;
		}
		$next['project_label'] = $label;
	}

	update_option( KIWIPRESS_BRIDGE_OPTION, $next );

	return rest_ensure_response( kiwipress_bridge_settings_payload() );
}

/**
 * JSON object, or application/x-www-form-urlencoded fields.
 *
 * An empty object changes nothing. A JSON array or scalar is a 400 so a
 * mistaken body is not stored. Form posts are only read when the request
 * is not JSON — get_json_params() is an empty array for those, and treating
 * that as the body would ignore the form.
 *
 * @param WP_REST_Request $request Incoming request.
 * @return array<string,mixed>|WP_Error
 */
function kiwipress_bridge_rest_body( WP_REST_Request $request ) {
	$content_type = $request->get_content_type();
	$type         = ( is_array( $content_type ) && isset( $content_type['value'] ) ) ? $content_type['value'] : '';

	if ( $type === 'application/json' ) {
		$raw = $request->get_body();
		if ( ! is_string( $raw ) || trim( $raw ) === '' ) {
			return array();
		}

		$decoded = json_decode( $raw, true );
		if ( JSON_ERROR_NONE !== json_last_error() || ! is_array( $decoded ) || kiwipress_bridge_is_list( $decoded ) ) {
			return new WP_Error(
				'kiwipress_bridge_invalid_body',
				__( 'Settings body must be a JSON object.', 'kiwipress-bridge' ),
				array( 'status' => 400 )
			);
		}

		return $decoded;
	}

	$body = $request->get_body_params();
	if ( ! is_array( $body ) ) {
		return array();
	}

	return $body;
}

/**
 * Re-state a field error without dropping its HTTP status.
 *
 * WP_Error::add_data() replaces the data array. The sanitizers already set
 * status 400; copying that forward keeps the response a 400.
 *
 * @param WP_Error $error Error from a sanitizer.
 * @param string   $field Option key that failed.
 * @return WP_Error
 */
function kiwipress_bridge_rest_field_error( WP_Error $error, $field ) {
	return new WP_Error(
		$error->get_error_code(),
		sprintf(
			/* translators: 1: option key, 2: validation message */
			__( '%1$s: %2$s', 'kiwipress-bridge' ),
			$field,
			$error->get_error_message()
		),
		array(
			'status' => 400,
			'field'  => $field,
		)
	);
}

/**
 * array_is_list() for PHP 7.4. An empty array is an object `{}` decoded, or
 * a list `[]`. Both have no keys we accept; treat empty as an object so a
 * POST of `{}` is a no-op success rather than a 400.
 *
 * @param array<mixed> $value Decoded JSON.
 * @return bool
 */
function kiwipress_bridge_is_list( array $value ) {
	if ( $value === array() ) {
		return false;
	}

	$index = 0;
	foreach ( $value as $key => $_unused ) {
		if ( $key !== $index ) {
			return false;
		}
		$index++;
	}

	return true;
}
