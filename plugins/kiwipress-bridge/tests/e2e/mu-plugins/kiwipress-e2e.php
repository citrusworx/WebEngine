<?php
/**
 * Fixtures for the KiwiPress Bridge end-to-end suite.
 *
 * Registers a REST custom post type and lets a test shorten the preview TTL
 * without editing the plugin. Empty or missing `kiwipress_e2e_preview_ttl`
 * leaves the plugin default (10 minutes). A negative value mints a token
 * that is already past the 30 second expiry skew.
 *
 * @package KiwiPressBridge
 */

add_action(
	'init',
	static function () {
		register_post_type(
			'kiwi_fruit',
			array(
				'label'           => 'Kiwi Fruit',
				'public'          => true,
				'show_in_rest'    => true,
				'rest_base'       => 'kiwi-fruit',
				'supports'        => array( 'title', 'editor', 'excerpt', 'revisions' ),
				'map_meta_cap'    => true,
				'capability_type' => 'post',
			)
		);
	}
);

add_filter(
	'kiwipress_bridge_preview_ttl',
	static function ( $ttl ) {
		$override = get_option( 'kiwipress_e2e_preview_ttl', false );
		if ( false === $override || '' === $override ) {
			return $ttl;
		}

		return (int) $override;
	}
);
