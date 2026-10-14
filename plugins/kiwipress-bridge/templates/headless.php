<?php
/**
 * Blank front template.
 *
 * Served when lockdown is on and there is no frontend URL to redirect to
 * (or the saved URL points back at this WordPress site). Seed copy from
 * "Activate Headless Mode": the page says "Headless Mode Activated" and
 * does not load the theme.
 *
 * @package KiwiPressBridge
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="robots" content="noindex, nofollow">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title><?php echo esc_html__( 'Headless Mode Activated', 'kiwipress-bridge' ); ?></title>
</head>
<body>
	<p><?php echo esc_html__( 'Headless Mode Activated', 'kiwipress-bridge' ); ?></p>
</body>
</html>
