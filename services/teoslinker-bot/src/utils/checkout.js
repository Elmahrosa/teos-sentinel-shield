'use strict';

/**
 * Dodo Payments checkout links.
 *
 * IMPORTANT: the branded `dodo.pe/...` shortlinks STRIP all query parameters
 * (verified: 301 → checkout.dodopayments.com/buy/<product> with the query
 * dropped). That means you cannot attach per-user metadata through them, so a
 * real customer would pay with `metadata: {}` and the credit webhook would be
 * rejected with `400 missing telegram id`.
 *
 * We therefore build the DIRECT checkout URL and attach the Telegram user id as
 * a `metadata_*` query parameter. Dodo static payment links forward every
 * `metadata_*` query param into the payment/subscription metadata, which the
 * activation service reads back on `payment.succeeded` / `subscription.active`.
 *
 * Product ids below are the LIVE products (all verified HTTP 200 on
 * checkout.dodopayments.com/buy/<id>).
 */

const PRODUCTS = {
  proMonthly:  process.env.DODO_PRODUCT_STARTER_MONTHLY || 'pdt_0NiubmCxvCi9MJbVfnJAT',
  proAnnual:   process.env.DODO_PRODUCT_STARTER_ANNUAL  || 'pdt_0NiubmDStYOWzNVUkcFC8',
  teamMonthly: process.env.DODO_PRODUCT_TEAM_MONTHLY     || 'pdt_0NiubmE6vERG5onrMT21p',
  teamAnnual:  process.env.DODO_PRODUCT_TEAM_ANNUAL      || 'pdt_0NiubmEpW4Oi0kzhoFZIC',
};

const BUY_BASE = (process.env.DODO_CHECKOUT_BASE || 'https://checkout.dodopayments.com/buy').replace(/\/+$/, '');

function checkoutUrl(productId, userId) {
  const url = new URL(`${BUY_BASE}/${productId}`);
  const id = userId === undefined || userId === null ? '' : String(userId).trim();
  if (id) {
    // Set both casings so the activation service matches regardless of how
    // Dodo normalises the key (`telegramId` or `telegram_id`).
    url.searchParams.set('metadata_telegramId', id);
    url.searchParams.set('metadata_telegram_id', id);
  }
  return url.toString();
}

function planUrl(planKey, userId) {
  const productId = PRODUCTS[planKey];
  if (!productId) throw new Error(`unknown plan key: ${planKey}`);
  return checkoutUrl(productId, userId);
}

function planLinks(userId) {
  return {
    proMonthly:  planUrl('proMonthly', userId),
    proAnnual:   planUrl('proAnnual', userId),
    teamMonthly: planUrl('teamMonthly', userId),
    teamAnnual:  planUrl('teamAnnual', userId),
  };
}

module.exports = { PRODUCTS, BUY_BASE, checkoutUrl, planUrl, planLinks };
