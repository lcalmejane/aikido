# Example

> **Version**: 1.0 | **Date**: 2026-01-01 | **Type**: Search Plan | **Language**: JavaScript

## Overview
Example plan.
## File Patterns
### Priority extensions
*.js *.ts
### Standard exclusions
node_modules/
## Search Method
Type: naive
## Search Patterns
### Imports
```regex javascript
^import\s+(.+)
```
### Declarations
```regex javascript
^class\s+(\w+)
```
## Extension Strategy
Follow imports.
## Output Format
```markdown
## file.js
**Classes** (line 1), **Interfaces**, **Functions**, **Dependencies**
```
## Context Extraction
Signatures.
## Performance Optimization
Restrict scope before searching.
## Usage Example
Inspect selected files.
