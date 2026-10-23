<?php
/**
 * The one option this plugin stores.
 *
 * Shape (option name: kiwipress_bridge):
 *
 *   frontend_url  string  Absolute http(s) URL, or "" until KiwiPress writes one.
 *   lockdown      bool    Default true on activation. Anonymous front is locked.
 *   paired        bool    Default false. KiwiPress sets this over REST (B1).
 *   project_label string  Optional label KiwiPress sends with pairing.
 *   preview_path  string  Path on the frontend that renders a draft preview.
 *                         Default `/preview`. Path only — never a URL.
 *
 * The preview HMAC secret is a different option, `kiwipress_bridge_preview_secret`.
 * It is not merged into this array and is not returned by health or settings.
 *
 * The wp-admin form may change frontend_url and lockdown only. paired and
 * project_label are preserved across that save so a settings click cannot
 * wipe a pairing the app already wrote.
 *
 * @package KiwiPressBridge
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Defaults used when the option row does not exist yet.
 *
 * lockdown is true so a freshly activated plugin does not leave the theme
 * public while the frontend URL is still empty.
 *
 * @return array{frontend_url:string,lockdown:bool,paired:bool,project_label:string,preview_path:string}
 */
function kiwipress_bridge_defaults() {
	return array(
		'frontend_url'  => '',
		'lockdown'      => true,
		'paired'        => false,
		'project_label' => '',
		'preview_path'  => '/preview',
	);
}

/**
 * Stored values with defaults filled in for any missing key.
 *
 * @return array{frontend_url:string,lockdown:bool,paired:bool,project_label:string,preview_path:string}
 */
function kiwipress_bridge_get_options() {
	$stored = get_option( KIWIPRESS_BRIDGE_OPTION, array() );
	if ( ! is_array( $stored ) ) {
		$stored = array();
	}

	$options = array_merge( kiwipress_bridge_defaults(), $stored );

	$options['frontend_url']  = is_string( $options['frontend_url'] ) ? $options['frontend_url'] : '';
	$options['lockdown']      = (bool) $options['lockdown'];
	$options['paired']        = (bool) $options['paired'];
	$options['project_label'] = is_string( $options['project_label'] ) ? $options['project_label'] : '';
	$options['preview_path']  = is_string( $options['preview_path'] ) ? $options['preview_path'] : '/preview';

	return $options;
}

/**
 * Settings returned by GET/POST /settings. Authenticated callers may see the URL.
 *
 * @return array{frontend_url:string,lockdown:bool,paired:bool,project_label:string,preview_path:string}
 */
function kiwipress_bridge_settings_payload() {
	$options = kiwipress_bridge_get_options();

	return array(
		'frontend_url'  => $options['frontend_url'],
		'lockdown'      => $options['lockdown'],
		'paired'        => $options['paired'],
		'project_label' => $options['project_label'],
		'preview_path'  => $options['preview_path'],
	);
}

/**
 * Public health facts. The frontend URL itself is not included — only whether
 * one is stored — so this route can stay unauthenticated without leaking it.
 *
 * @return array{plugin_version:string,wp_version:string,lockdown:bool,paired:bool,frontend_url_set:bool,site_url:string,features:string[]}
 */
function kiwipress_bridge_health_payload() {
	$options = kiwipress_bridge_get_options();

	return array(
		'plugin_version'   => KIWIPRESS_BRIDGE_VERSION,
		'wp_version'       => get_bloginfo( 'version' ),
		'lockdown'         => $options['lockdown'],
		'paired'           => $options['paired'],
		'frontend_url_set' => $options['frontend_url'] !== '',
		// WordPress address, where /wp-json lives — not home_url, which may differ.
		'site_url'         => untrailingslashit( get_site_url() ),
		'features'         => array( 'preview' ),
	);
}

/**
 * Accept "" or an absolute http(s) URL.
 *
 * localhost and non-standard ports are allowed: the KiwiPress front often
 * runs on http://localhost:5173 during pairing. wp_http_validate_url() is
 * intentionally not used — it rejects those hosts.
 *
 * @param mixed $value Raw value.
 * @return string|WP_Error Clean URL, or an error with HTTP status 400.
 */
function kiwipress_bridge_sanitize_frontend_url( $value ) {
	if ( ! is_string( $value ) ) {
		return new WP_Error(
			'kiwipress_bridge_invalid_frontend_url',
			__( 'frontend_url must be a string.', 'kiwipress-bridge' ),
			array( 'status' => 400 )
		);
	}

	$value = trim( $value );
	if ( $value === '' ) {
		return '';
	}

	$clean = esc_url_raw( $value );
	$parts = wp_parse_url( $clean );
	$scheme = '';
	if ( is_array( $parts ) && isset( $parts['scheme'] ) ) {
		$scheme = strtolower( (string) $parts['scheme'] );
	}
	$host = ( is_array( $parts ) && isset( $parts['host'] ) ) ? (string) $parts['host'] : '';

	if ( $clean === '' || $host === '' || ( $scheme !== 'http' && $scheme !== 'https' ) ) {
		return new WP_Error(
			'kiwipress_bridge_invalid_frontend_url',
			__( 'frontend_url must be empty or an absolute http(s) URL.', 'kiwipress-bridge' ),
			array( 'status' => 400 )
		);
	}

	return $clean;
}

/**
 * Accept real booleans and the handful of strings HTML/JSON clients send.
 *
 * @param mixed $value Raw value.
 * @return bool|WP_Error
 */
function kiwipress_bridge_sanitize_bool( $value ) {
	if ( is_bool( $value ) ) {
		return $value;
	}

	if ( is_int( $value ) && ( $value === 0 || $value === 1 ) ) {
		return $value === 1;
	}

	if ( is_string( $value ) ) {
		$normalized = strtolower( trim( $value ) );
		if ( in_array( $normalized, array( '1', 'true', 'yes', 'on' ), true ) ) {
			return true;
		}
		if ( in_array( $normalized, array( '0', 'false', 'no', 'off', '' ), true ) ) {
			return false;
		}
	}

	return new WP_Error(
		'kiwipress_bridge_invalid_bool',
		__( 'Expected a boolean.', 'kiwipress-bridge' ),
		array( 'status' => 400 )
	);
}

/**
 * Plain text label. Empty is allowed.
 *
 * @param mixed $value Raw value.
 * @return string|WP_Error
 */
function kiwipress_bridge_sanitize_project_label( $value ) {
	if ( ! is_string( $value ) ) {
		return new WP_Error(
			'kiwipress_bridge_invalid_project_label',
			__( 'project_label must be a string.', 'kiwipress-bridge' ),
			array( 'status' => 400 )
		);
	}

	$clean = sanitize_text_field( $value );
	if ( strlen( $clean ) > 190 ) {
		$clean = substr( $clean, 0, 190 );
	}

	return $clean;
}

/**
 * A path on the frontend. Empty falls back to `/preview`.
 *
 * Rejects a scheme, a host, a protocol-relative `//`, backslashes, query
 * strings, fragments, and `..`. That keeps the preview redirect from
 * becoming an open redirect off the saved frontend origin.
 *
 * @param mixed $value Raw value.
 * @return string|WP_Error
 */
function kiwipress_bridge_sanitize_preview_path( $value ) {
	if ( ! is_string( $value ) ) {
		return new WP_Error(
			'kiwipress_bridge_invalid_preview_path',
			__( 'preview_path must be a string.', 'kiwipress-bridge' ),
			array( 'status' => 400 )
		);
	}

	$value = trim( $value );
	if ( $value === '' ) {
		return '/preview';
	}

	if ( strlen( $value ) > 1 ) {
		$value = rtrim( $value, '/' );
	}

	$invalid = new WP_Error(
		'kiwipress_bridge_invalid_preview_path',
		__( 'preview_path must be a path such as /preview, with no scheme, host, or //.', 'kiwipress-bridge' ),
		array( 'status' => 400 )
	);

	if ( strlen( $value ) > 180 || false !== strpos( $value, '//' ) || false !== strpos( $value, '..' ) ) {
		return $invalid;
	}

	if ( '/' === $value ) {
		return $value;
	}

	if ( ! preg_match( '#^/(?:[A-Za-z0-9._~-]+)(?:/[A-Za-z0-9._~-]+)*$#', $value ) ) {
		return $invalid;
	}

	return $value;
}

/**
 * Sanitize callback for the Settings API and for update_option().
 *
 * Two callers share this function, and they mean different things when a
 * key is missing:
 *
 * - wp-admin posts only frontend_url and lockdown. An unchecked checkbox is
 *   absent, which means lockdown off. paired and project_label are kept.
 * - REST builds a full array first (see includes/rest.php) and only includes
 *   keys the client sent, merged onto the current option. During that
 *   request REST_REQUEST is defined, so every key in $input is trusted as
 *   an intentional value and re-checked.
 *
 * Returning a WP_Error from a sanitize callback would store the error object
 * as the option, so invalid admin input keeps the previous field and records
 * a settings error instead. REST validates before it calls update_option().
 *
 * @param mixed $input Posted or proposed option value.
 * @return array{frontend_url:string,lockdown:bool,paired:bool,project_label:string,preview_path:string}
 */
function kiwipress_bridge_sanitize_options( $input ) {
	$current = kiwipress_bridge_get_options();
	if ( ! is_array( $input ) ) {
		return $current;
	}

	$is_rest = defined( 'REST_REQUEST' ) && REST_REQUEST;
	$next    = $current;

	if ( array_key_exists( 'frontend_url', $input ) ) {
		$url = kiwipress_bridge_sanitize_frontend_url( $input['frontend_url'] );
		if ( is_wp_error( $url ) ) {
			if ( ! $is_rest ) {
				add_settings_error(
					'kiwipress_bridge',
					$url->get_error_code(),
					$url->get_error_message()
				);
			}
		} else {
			$next['frontend_url'] = $url;
		}
	}

	if ( $is_rest ) {
		if ( array_key_exists( 'lockdown', $input ) ) {
			$lockdown = kiwipress_bridge_sanitize_bool( $input['lockdown'] );
			if ( ! is_wp_error( $lockdown ) ) {
				$next['lockdown'] = $lockdown;
			}
		}
		if ( array_key_exists( 'paired', $input ) ) {
			$paired = kiwipress_bridge_sanitize_bool( $input['paired'] );
			if ( ! is_wp_error( $paired ) ) {
				$next['paired'] = $paired;
			}
		}
		if ( array_key_exists( 'project_label', $input ) ) {
			$label = kiwipress_bridge_sanitize_project_label( $input['project_label'] );
			if ( ! is_wp_error( $label ) ) {
				$next['project_label'] = $label;
			}
		}
		if ( array_key_exists( 'preview_path', $input ) ) {
			$path = kiwipress_bridge_sanitize_preview_path( $input['preview_path'] );
			if ( ! is_wp_error( $path ) ) {
				$next['preview_path'] = $path;
			}
		}
		return $next;
	}

	if ( array_key_exists( 'preview_path', $input ) ) {
		$path = kiwipress_bridge_sanitize_preview_path( $input['preview_path'] );
		if ( is_wp_error( $path ) ) {
			add_settings_error(
				'kiwipress_bridge',
				$path->get_error_code(),
				$path->get_error_message()
			);
		} else {
			$next['preview_path'] = $path;
		}
	}

	// Admin form: checkbox omitted means unchecked. Do not touch pairing.
	$next['lockdown']      = ! empty( $input['lockdown'] );
	$next['paired']        = $current['paired'];
	$next['project_label'] = $current['project_label'];

	return $next;
}
