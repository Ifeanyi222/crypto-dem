import { Router } from 'express';

const router = Router();

const CHAIN_ID = 1; // Ethereum mainnet
const NATIVE_ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const TOKENS = {
  ETH: NATIVE_ETH,
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
};

// GET /api/trade/quote?sellToken=ETH&buyToken=USDC&sellAmountWei=1000000000000000000&taker=0x...
router.get('/quote', async (req, res) => {
  const { ZEROX_API_KEY } = process.env;
  const { sellToken, buyToken, sellAmountWei, taker } = req.query;

  if (!ZEROX_API_KEY) {
    return res.status(503).json({
      error: 'Trading is not configured yet. Sign up at dashboard.0x.org, then set ZEROX_API_KEY in .env.',
    });
  }
  if (!sellToken || !buyToken || !sellAmountWei || !taker) {
    return res.status(400).json({ error: 'sellToken, buyToken, sellAmountWei, and taker are required.' });
  }
  const sellAddr = TOKENS[sellToken.toUpperCase()];
  const buyAddr = TOKENS[buyToken.toUpperCase()];
  if (!sellAddr || !buyAddr) {
    return res.status(400).json({ error: `Unsupported token. Supported: ${Object.keys(TOKENS).join(', ')}` });
  }

  try {
    const params = new URLSearchParams({
      chainId: String(CHAIN_ID),
      sellToken: sellAddr,
      buyToken: buyAddr,
      sellAmount: sellAmountWei,
      taker,
    });
    const response = await fetch(`https://api.0x.org/swap/allowance-holder/quote?${params}`, {
      headers: { '0x-api-key': ZEROX_API_KEY, '0x-version': 'v2' },
    });
    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: data?.reason || data?.message || '0x rejected the request.' });

    res.json({
      buyAmount: data.buyAmount,
      buyToken: buyToken.toUpperCase(),
      sellAmount: data.sellAmount,
      sellToken: sellToken.toUpperCase(),
      estimatedPriceImpact: data.estimatedPriceImpact,
      transaction: data.transaction, // { to, data, value, gas } — ready to send via the wallet
    });
  } catch (err) {
    res.status(502).json({ error: 'Could not reach the trading provider. Try again shortly.' });
  }
});

export default router;
