# TEST ONLY

`test-only-localhost-cert.pem` and `test-only-localhost-key.pem` are a self-signed certificate and key for `handler.conformance.test.ts`. They are not a secret and not for production. Do not use them outside this test.

Node's `node:crypto` can parse an X.509 certificate (`X509Certificate`) and can sign bytes. It cannot mint a certificate. This fixture was generated with OpenSSL (`openssl req -x509`, CN=localhost, RSA 2048, no passphrase) and committed so the HTTPS recipe test does not need a dependency or the `openssl` binary at test time.

`*.pem` is gitignored at the repo root. These two files are force-added.
