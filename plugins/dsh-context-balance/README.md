# @bpicori/dsh-context-balance

Shows the **topped-up account balance** in the DeepSeek Harness composer, in the same strip as the context-occupancy meter — so the number that otherwise lives in Settings → Account is visible while you work.

## Behaviour

| Account state | What the chip shows |
|---|---|
| `ready` with wallets | `Topped-up balance ¥12.34` (one amount per wallet, `·` separated) |
| not signed in | muted `Sign in to view` |
| read failed | muted `View on Platform` |
| empty wallet list | nothing |
| no account Remote, or a transport failure | nothing at all |

The granted balance (`bonusWallets`) is deliberately not shown. Amounts are formatted exactly like Settings → Account: `¥`/`$`, thousands separators, two decimals, `<¥0.01` below a cent. The value refreshes on mount, when the window regains focus, and when the tab becomes visible again.

## Install

```sh
dsh plugin --profile web add @bpicori/dsh-context-balance
```

Restart afterwards. On the reserved `desktop` profile, install through the GUI instead: **Plugins → Add plugin → Enter the plugin's npm package name** (`@bpicori/dsh-context-balance`), then restart the app.

## Requirements

- DeepSeek Harness `>=0.2.0-rc.2`.
- A signed-in DeepSeek account for a balance to display. The reference row in Settings → Account renders only in the desktop application, so that is the surface where the two values can be compared directly.

## Where it renders

It registers one entry in the `conversation.composer.dock` slot — documented as *"ambient entries below the composer card"* — with `order: 100`, after the shipped performance pills. It renders directly above the context ring in the composer strip.

It cannot render *inside* the context meter's popover panel: that panel's legend rows are hardcoded in `dsh-client-ui-conversation`, which ships inside the read-only application bundle and offers no slot there.

## Notes

- No Harness Client package is imported; the chip uses host theme tokens and plain inline styles.
- Visible text is routed through the Client locale service, with copy matching the shipped Settings → Account wording in English and Chinese.

## Licence

MIT
