# RTK command usage

When running shell commands in Zoo Code, prefix supported commands with `rtk`
to reduce output, for example `rtk git status`, `rtk git diff`, `rtk rg ...`,
and `rtk npm test`. For RTK-specific diagnostics, run `rtk gain` or
`rtk discover`.

RTK is installed on the host as `rtk`. Do not prefix unsupported commands;
run those normally. This is an instruction-based integration: Zoo Code does
not have an RTK-native command-rewrite hook.
