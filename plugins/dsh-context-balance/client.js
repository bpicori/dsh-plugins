/**
 * Composer balance chip.
 *
 * Registers one ambient entry in the `conversation.composer.dock` slot — the
 * strip below the composer card that already holds the context-occupancy meter —
 * and reads the account balance over the `account` Remote, the same method
 * Settings -> Account uses. Renders nothing when no account Remote, no wallet,
 * or no signed-in balance is available.
 */
window.__ModuleLoader__.load({
  id: '@bpicori/dsh-context-balance',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** Client locale namespace and slot identity for this plugin. */
    const NS = '@bpicori/dsh-context-balance';
    /**
     * Account-client build label carried by every account Remote call. The wire
     * schema requires a non-empty string; this plugin has no build step, so the
     * value is the release it was authored against.
     */
    const VERSION = '0.2.0';
    /** Dock order: after the shipped performance pills (`stats`, order 0). */
    const ORDER = 100;

    /** English copy, matching the shipped Settings -> Account wording. */
    const en = {
      balance: 'Topped-up balance',
      balanceUnavailable: 'View on Platform',
      balanceSignedOut: 'Sign in to view',
    };
    /** Chinese copy, matching the shipped Settings -> Account wording. */
    const zh = {
      balance: '充值余额',
      balanceUnavailable: '前往开放平台查看',
      balanceSignedOut: '登录后查看',
    };

    /** Visual language shared with the context meter's own trigger. */
    const styles = {
      root: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '1px 8px',
        flex: 'none',
        fontFamily: 'inherit',
        fontSize: 'var(--dsh-content-font-size-secondary, 13px)',
        lineHeight: 'calc(20px + var(--dsh-content-font-delta-secondary, 0px))',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      },
      label: { color: 'var(--dsw-alias-label-tertiary)' },
      value: { color: 'var(--dsw-alias-label-primary)', fontWeight: 500 },
      muted: { color: 'var(--dsw-alias-label-tertiary)' },
    };

    /**
     * Truncate a decimal amount string toward zero at two places, reporting the
     * two cases the shipped formatter calls out separately: an exact zero, and a
     * magnitude below one cent.
     * @param amount - amount string as the account API reports it.
     * @returns the sign, the truncated digits, and both special cases.
     */
    function splitAmount(amount) {
      const text = String(amount ?? '').trim();
      const negative = text.startsWith('-');
      const digits = text.replace(/^[+-]/u, '');
      const [rawInteger = '0', rawFraction = ''] = digits.split('.');
      const integer = rawInteger.replace(/\D/gu, '') || '0';
      const fraction = `${rawFraction.replace(/\D/gu, '')}00`.slice(0, 2);
      const zero = !/[1-9]/u.test(integer + fraction);
      const belowCent = zero && /[1-9]/u.test(rawFraction.slice(2));
      return { negative, integer, fraction, zero, belowCent };
    }

    /**
     * Format one wallet amount the way Settings -> Account does.
     * @param amount - amount string from the account API.
     * @param symbol - `¥` or `$`.
     * @returns the display amount.
     */
    function formatAmount(amount, symbol) {
      const { negative, integer, fraction, zero, belowCent } = splitAmount(amount);
      if (zero) {
        if (!negative) return belowCent ? `<${symbol}0.01` : `${symbol}0.00`;
        return belowCent ? `-${symbol}0.01` : `${symbol}0.00`;
      }
      return `${negative ? '-' : ''}${symbol}${Number(integer).toLocaleString()}.${fraction}`;
    }

    /**
     * Symbol for the two currencies the account API reports.
     * @param currency - wallet currency code.
     * @returns the display symbol.
     */
    const symbolOf = (currency) => (currency === 'CNY' ? '¥' : '$');

    /**
     * Build the chip component, closing over the plugin context for Remote reads.
     * @param ctx - Client plugin context.
     * @returns the slot component.
     */
    function createChip(ctx) {
      /** Metadata every account Remote method carries. */
      const metadata = () => ({
        version: VERSION,
        locale: ctx.locale?.getSnapshot?.().active ?? globalThis.navigator?.language ?? 'en',
        timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60,
      });

      /** Read the balance once, mapping every outcome to a renderable phase. */
      const read = async () => {
        const account = ctx.remote?.account;
        if (typeof account?.getBalance !== 'function') return { phase: 'absent' };
        try {
          const result = await account.getBalance(metadata());
          // A transport-level failure or an unavailable remote is nothing the
          // chip can act on, so it renders nothing; only a protocol-level
          // `failed` value earns the platform link.
          if (result === undefined || result.ok !== true) return { phase: 'absent' };
          const value = result.value;
          if (value === undefined || value === null) return { phase: 'signed-out' };
          if (value.status !== 'ready') return { phase: 'failed' };
          const wallets = Array.isArray(value.value) ? value.value : [];
          if (wallets.length === 0) return { phase: 'absent' };
          // Only the topped-up wallets are shown; `bonusWallets` (granted
          // balance) is deliberately ignored.
          return { phase: 'ready', wallets };
        } catch {
          return { phase: 'failed' };
        }
      };

      return function ContextBalance({ t }) {
        const [state, setState] = React.useState({ phase: 'loading' });
        React.useEffect(() => {
          let live = true;
          const refresh = () => {
            read().then((next) => {
              if (live) setState(next);
            });
          };
          refresh();
          const onFocus = () => refresh();
          const onVisibility = () => {
            if (document.visibilityState === 'visible') refresh();
          };
          window.addEventListener('focus', onFocus);
          document.addEventListener('visibilitychange', onVisibility);
          return () => {
            live = false;
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibility);
          };
        }, []);

        if (state.phase === 'absent' || state.phase === 'loading') return null;

        if (state.phase !== 'ready') {
          return h(
            'div',
            { style: styles.root },
            h(
              'span',
              { style: styles.muted },
              state.phase === 'signed-out' ? t('balanceSignedOut') : t('balanceUnavailable'),
            ),
          );
        }

        const label = t('balance');
        const amounts = state.wallets
          .map((wallet) => formatAmount(wallet.balance, symbolOf(wallet.currency)))
          .join(' · ');
        return h(
          'div',
          { style: styles.root, title: label, 'aria-label': `${label} ${amounts}` },
          h('span', { style: styles.label }, label),
          h('span', { style: styles.value }, amounts),
        );
      };
    }

    return {
      inject: ['slots', 'locale', 'remote', 'remote.account'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'context-balance: dictionaries');
        ctx.slots.inject('conversation.composer.dock', () =>
          ctx.slots.register(
            {
              name: 'conversation.composer.dock',
              id: 'context-balance',
              order: ORDER,
              locale: NS,
            },
            createChip(ctx),
          ),
        );
      },
    };
  },
});
