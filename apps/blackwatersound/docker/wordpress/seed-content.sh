#!/bin/sh
set -eu

WP="wp --allow-root --path=/var/www/html"

echo "Waiting for WordPress..."
until $WP core is-installed 2>/dev/null; do
  sleep 3
done

if ! $WP post list --post_type=post --name=germanium-vs-silicon-fuzz --format=ids | grep -q .; then
  $WP post create --post_type=post --post_status=publish \
    --post_name=germanium-vs-silicon-fuzz \
    --post_title="Why Germanium Still Beats Silicon for Fuzz" \
    --post_excerpt="The debate between germanium and silicon transistors in fuzz circuits has been going on since the late 1960s." \
    --post_content="The debate between germanium and silicon transistors in fuzz circuits has been going on since the late 1960s. Fifty years on, boutique builders keep coming back to germanium — and there are very good reasons why."

  $WP post create --post_type=page --post_status=publish \
    --post_name=bias-germanium-fuzz \
    --post_title="Biasing Your Germanium Fuzz" \
    --post_excerpt="Learn how to find the ideal bias point on a germanium fuzz pedal using a multimeter and your ears." \
    --post_content="In this lesson you'll learn how to find the ideal bias point on a germanium fuzz pedal using a multimeter and your ears."

  echo "WordPress seed content created."
else
  echo "WordPress seed content already exists."
fi

mkdir -p /secrets
chmod 777 /secrets
if [ ! -f /secrets/wp-app-password ]; then
  APP_PASSWORD=$($WP user application-password create "$WP_ADMIN_USER" "KiwiPress" --porcelain)
  printf '%s' "$APP_PASSWORD" > /secrets/wp-app-password
  echo "Created KiwiPress application password."
else
  echo "KiwiPress application password already present."
fi
