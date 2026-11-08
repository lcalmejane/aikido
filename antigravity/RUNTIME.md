# Runtime requirements

The shared project runtime uses stable Node.js 24+ and a command tool with access to the target project. The package does not install Node or grant permissions. Run `node --version` in the actual executor before use. If Node or command access is unavailable, report the blocked operation; do not install dependencies or change permissions automatically.

The packaged `scripts/check-cli.mjs` reports its own process version and executable in `nodeRuntime`; it cannot verify another agent, host or container. A below-baseline result is advisory and does not prove that the operation fails. Use documented equivalent fallbacks only when they preserve the requested result.
