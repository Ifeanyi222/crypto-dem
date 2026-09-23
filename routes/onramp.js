import { Router } from 'express';

const router = Router();

// POST /api/onramp/widget-url — generates a Transak widget session for the "Fund Wallet" flow
router.post('/widget-url', async (req, res) => {
  const { walletAddress, fiatAmount, fiatCurrency, cryptoCurrencyCode } = req.body || {};
  const { TRANSAK_API_KEY, TRANSAK_ACCESS_TOKEN, APP_URL } = process.env;

  if (!TRANSAK_API_KEY || !TRANSAK_ACCESS_TOKEN) {
    return res.status(503).json({
      error: 'Fiat on-ramp is not configured yet. Sign up free at dashboard.transak.com, then set TRANSAK_API_KEY and TRANSAK_ACCESS_TOKEN in .env.',
    });
  }

  try {
    const referrerDomain = (APP_URL || 'http://localhost:5173').replace(/^https?:\/\//, '');
    const response = await fetch('https://api-gateway-stg.transak.com/api/v2/auth/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'access-token': TRANSAK_ACCESS_TOKEN },
      body: JSON.stringify({
        widgetParams: {
          apiKey: TRANSAK_API_KEY,
          referrerDomain,
          walletAddress: walletAddress || undefined,
          fiatAmount: fiatAmount || undefined,
          fiatCurrency: fiatCurrency || 'USD',
          cryptoCurrencyCode: cryptoCurrencyCode || 'ETH',
        },
      }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: data?.message || 'Transak rejected the request.' });

    const widgetUrl = `https://global-stg.transak.com?apiKey=${TRANSAK_API_KEY}&sessionId=${data.sessionId}`;
    res.json({ widgetUrl });
  } catch (err) {
    res.status(502).json({ error: 'Could not reach the on-ramp provider. Try again shortly.' });
  }
});

export default router;
