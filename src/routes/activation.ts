import { Router, Request, Response } from 'express';
import { nanoid } from 'nanoid';

const router = Router();

interface ActivationRequest {
  txHash: string;
  telegramUserId: string;
  telegramHandle?: string;
  tier?: string;
  network: string;
}

// POST /activation/verify - Verify payment and generate license
router.post('/verify', async (req: Request<{}, {}, ActivationRequest>, res: Response) => {
  try {
    const { txHash, telegramUserId, telegramHandle, tier = 'pioneer', network } = req.body;
    
    // Validate required fields
    if (!txHash || !telegramUserId) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing required fields: txHash and telegramUserId' 
      });
    }
    
    // Validate TX hash format (Solana TX hashes are base58, ~88 chars)
    if (txHash.length < 30) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Invalid transaction hash' 
      });
    }
    
    // Generate license key
    const licenseKey = `TEOS-${tier.substring(0, 3).toUpperCase()}-${nanoid(8).toUpperCase()}`;
    
    // TODO: Add real Solana verification here
    // For now, mock successful activation
    
    // TODO: Save to database via Prisma
    // await prisma.license.create({ ... })
    
    res.json({
      ok: true,
      licenseKey,
      tier,
      status: 'active',
      telegramUserId,
      activatedAt: new Date().toISOString(),
      message: 'Mock activation - integrate Solana verification for production'
    });
    
  } catch (error) {
    console.error('Activation error:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;
