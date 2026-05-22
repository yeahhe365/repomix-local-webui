# repomix-local-webui

<p align="center">
  <a href="./README.md">中文</a> | <a href="./README.en.md">English</a>
</p>

Chinese-first Repomix Web UI with Docker packaging for local codebase-to-context workflows.

## Overview

This repository is a Chinese-first local Web UI and packaging workspace around Repomix. It keeps the upstream Repomix workflow while adding local Web UI usage paths and Docker-oriented deployment options.

## Highlights

- Chinese-first documentation and local usage guidance.
- Repomix CLI workflow for packing repository content into AI-friendly context files.
- Local Docker Web UI packaging for self-hosted use.
- Browser extension, website, server, and core CLI workspaces in one repository.
- Existing upstream-compatible scripts for build, lint, test, and packaging.

## Quick Start

### CLI

```bash
npm install
npm run build
npm run repomix
```

### Local Docker Web UI

Use the repository Docker files and website compose configuration when you want a local Web UI deployment. The Chinese README contains the most detailed deployment notes for this fork.

## Common Commands

```bash
npm run build
npm run test
npm run lint
npm run website
```

## Project Structure

- `src` - core Repomix implementation.
- `bin` - CLI entry points.
- `browser` - browser extension workspace.
- `website` - website client and server workspaces.
- `docs` - project documentation.
- `tests` - automated tests.

## Tech Stack

- TypeScript
- Node.js
- Vitest
- Docker
- Repomix

## Relationship To Upstream

This fork is oriented toward Chinese documentation, local Web UI use, and Docker packaging while preserving the core Repomix workflow. Refer to the Chinese README for fork-specific details and upstream links.

## Contributing

Issues and pull requests are welcome. Keep changes focused and verify build, lint, and tests before submitting.

---

## Related Community

- [Linux.do](https://linux.do/): an active Chinese tech community focused on AI, software development, resource sharing, and frontier technology discussions. Its vision is "a new ideal community", and its community culture emphasizes sincerity, friendliness, unity, and professionalism.

## License

License information is available in the repository `LICENSE` file.
