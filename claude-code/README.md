# AI-KIDO

AI-KIDO is an AI Memory Bank Construction Method by Meta harness. This plugin supplies the AI-KIDO commands, system skills and available specialist agents for Claude Code. Its bundled knowledge payload is read-only and is used to initialize a project when requested.

Install the plugin, open the intended project, then run `/aikido:init-aikido` to review and apply the project bootstrap. The plugin does not modify project files on installation. Review the displayed plan and explicitly confirm it before files are written.

After initialization, project-pinned instructions and the version in `.aikido/lock.json` remain authoritative. Use `/aikido:maj-aikido --update` to plan a method update; plugin updates and project method updates are separate. Local project knowledge is never written back into this plugin package. This staging package is not a published release.
