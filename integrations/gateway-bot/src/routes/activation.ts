import { Router, Request, Response } from 'express';
import { nanoid } from 'nanoid';

const router = Router();

router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { txHash, telegramUserId, tier = 'pioneer' } = req.body;
    const incomingSecret = req.headers['x-bot-secret'];

    if (incomingSecret !== process.env.BOT_SHARED_SECRET) {
      return res.status(403).json({ ok: false, error: 'Unauthorized' });
    }

    const licenseKey = `TEOS-${tier.substring(0, 3).toUpperCase()}-${nanoid(8).toUpperCase()}`;

    res.json({
      ok: true,
      licenseKey,
      status: 'active'
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Internal error' });
  }
});

export default router;
