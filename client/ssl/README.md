# TLS certificates

`docker-compose.prod.yml` mounts this directory into nginx at
`/etc/nginx/ssl`. Place your `fullchain.pem` / `privkey.pem` here at deploy
time (or let Traefik/Let's Encrypt manage certs). Certificate files (`*.pem`)
are gitignored and must NOT be committed.
