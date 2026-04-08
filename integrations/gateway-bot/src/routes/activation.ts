cat <<EOT > src/routes/activation.ts
import { Router, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { txHash, telegramUserId, tier = 'pioneer' } = req.body;
    const incomingSecret = req.headers['x-bot-secret'];

    // 1. Security Handshake
    if (incomingSecret !== process.env.BOT_SHARED_SECRET) {
      return res.status(403).json({ ok: false, error: 'Unauthorized gateway' });
    }

    // 2. Prevent Duplicate Activations
    const existingActivation = await prisma.activation.findFirst({
      where: { telegramUserId: telegramUserId.toString() }
    });

    if (existingActivation) {
      // Find the associated license
      const license = await prisma.license.findFirst({
        where: { activationId: existingActivation.id }
      });
      return res.json({ 
        ok: true, 
        licenseKey: license?.id, 
        status: 'already_active',
        note: 'Existing license retrieved' 
      });
    }

    // 3. Generate Sovereign License Key
    const licenseKey = \`TEOS-\${tier.substring(0, 3).toUpperCase()}-\${nanoid(8).toUpperCase()}\`;

    // 4. Atomic Transaction: Save Activation and License
    const result = await prisma.\$transaction(async (tx) => {
      const activation = await tx.activation.create({
        data: {
          txHash,
          telegramUserId: telegramUserId.toString(),
          network: 'solana',
          status: 'completed'
        }
      });

      const license = await tx.license.create({
        data: {
          id: licenseKey,
          activationId: activation.id,
          tier: tier
        }
      });

      return license;
    });

    console.log(\`[DB] New License Secured: \${result.id} for User \${telegramUserId}\`);

    res.json({
      ok: true,
      licenseKey: result.id,
      status: 'activated',
      activatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ ok: false, error: 'Failed to secure license in vault' });
  }
});

export default router;
EOT