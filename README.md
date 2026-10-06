# dsh-plugins

Custom [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh) plugins, published to npm under the `@bpicori` scope.

Every plugin is a buildless bundle: plain committed JavaScript, no dependencies, no build step. That is deliberate — pnpm blocks dependency install scripts by default and dsh asks for explicit approval before running them, so a plugin that needs no build installs cleanly anywhere.

## Plugins

| Plugin | What it does |
|---|---|
| [`@bpicori/context-balance`](plugins/context-balance) | Shows the topped-up account balance in the composer strip, beside the context-occupancy meter |

## Install

Install into a profile with the dsh CLI or the **Plugins** page in the GUI. Every install or replacement needs a restart, because the client boot graph is composed at startup.

From npm:

```sh
dsh plugin --profile web add @bpicori/context-balance
```

From this repository, without the registry:

```sh
dsh plugin --profile web add github:bpicori/dsh-plugins#path:plugins/context-balance
```

From a local checkout, for development (`link:` — edits need only a relaunch):

```sh
dsh plugin --profile web add /absolute/path/to/dsh-plugins/plugins/context-balance
```

The `desktop` profile is reserved for the Electron application: install through the GUI's **Plugins → Add plugin** flow rather than the CLI. To remove a plugin from that profile, quit the app first and then run `dsh plugin --profile desktop remove <package>`.

## Layout

```
plugins/<name>/          one package per plugin
  package.json           bundle patch + dsh.client declaration + publish metadata
  cordis.patch.yml       the loader row this plugin inserts
  index.js               host half (empty unless the plugin needs host services)
  client.js              browser half: the window.__ModuleLoader__ factory
  icon.svg               Plugins-page icon
  locale/{en,zh}.json    Plugins-page title and description
```

One directory is one package is one plugin: a package declares exactly one `dsh.bundle.patch`, and its browser artifact registers one lazy factory whose id equals the package name.

## Publishing

```sh
npm login
npm whoami                                          # must be bpicori, or an org of that name
npm version 1.0.1 -w plugins/context-balance        # bump one plugin
npm publish --workspaces --access public            # publish all plugins
```

Notes:

- `publishConfig.access` is `public` in each manifest because scoped packages otherwise publish restricted.
- `files` must list `cordis.patch.yml` and `locale` — without the patch the installed bundle has no rows and does nothing.
- `peerDependencies` declares a dsh range, never an exact prerelease: dsh refuses to load a plugin whose declared range excludes the running runtime.
- Published names and versions are effectively permanent. Decide the scope and names before the first publish.

## Adding a plugin

1. Copy an existing directory under `plugins/` and rename it.
2. Set the package `name`, the patch row `name`, the loader `id`, and the locale namespace to the same string.
3. Keep it dependency-free unless there is a strong reason not to.

## Licence

MIT. See [LICENSE](LICENSE).
