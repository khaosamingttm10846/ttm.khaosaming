import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { db } from './src/db/index.ts';
import { serviceRecords, financialRecords, clinicEvents, users } from './src/db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import { optionalAuth, requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser } from './src/db/users.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // ==========================================
  // AUTH ROUTES
  // ==========================================
  app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthenticated' });
      }
      const user = await getOrCreateUser(
        req.user.uid,
        req.user.email || '',
        req.user.name || (req.body && req.body.name),
        req.user.picture || (req.body && req.body.photoUrl)
      );
      res.json({ success: true, user });
    } catch (error: any) {
      console.error('Error syncing user:', error);
      res.status(500).json({ error: error.message || 'Failed to sync user' });
    }
  });

  // ==========================================
  // SERVICE RECORDS ROUTES
  // ==========================================
  app.get('/api/services', async (_req: Request, res: Response) => {
    try {
      const records = await db
        .select()
        .from(serviceRecords)
        .orderBy(desc(serviceRecords.serviceDate));
      res.json(records);
    } catch (error: any) {
      console.error('Error fetching services:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch services' });
    }
  });

  app.post('/api/services', optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body;
      const record = {
        ...body,
        createdBy: req.user?.email || body.createdBy || 'system',
      };
      await db.insert(serviceRecords).values(record);
      res.status(201).json(record);
    } catch (error: any) {
      console.error('Error creating service record:', error);
      res.status(500).json({ error: error.message || 'Failed to create service' });
    }
  });

  app.post('/api/services/batch', optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
      const items: any[] = req.body.items || [];
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'No items provided for batch import' });
      }

      const creator = req.user?.email || 'imported';
      const formatted = items.map((item) => ({
        ...item,
        createdBy: item.createdBy || creator,
      }));

      // Insert in chunks of 50 to avoid parameter limit
      const chunkSize = 50;
      for (let i = 0; i < formatted.length; i += chunkSize) {
        const chunk = formatted.slice(i, i + chunkSize);
        await db.insert(serviceRecords).values(chunk).onConflictDoNothing();
      }

      res.status(201).json({ success: true, count: formatted.length });
    } catch (error: any) {
      console.error('Error batch inserting services:', error);
      res.status(500).json({ error: error.message || 'Failed to batch insert services' });
    }
  });

  app.put('/api/services/:id', optionalAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const body = req.body;
      await db
        .update(serviceRecords)
        .set(body)
        .where(eq(serviceRecords.id, id));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating service record:', error);
      res.status(500).json({ error: error.message || 'Failed to update service' });
    }
  });

  app.delete('/api/services/:id', optionalAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await db.delete(serviceRecords).where(eq(serviceRecords.id, id));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting service record:', error);
      res.status(500).json({ error: error.message || 'Failed to delete service' });
    }
  });

  // ==========================================
  // FINANCIAL RECORDS ROUTES
  // ==========================================
  app.get('/api/finances', async (_req: Request, res: Response) => {
    try {
      const records = await db
        .select()
        .from(financialRecords)
        .orderBy(desc(financialRecords.date));
      res.json(records);
    } catch (error: any) {
      console.error('Error fetching finances:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch finances' });
    }
  });

  app.post('/api/finances', optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body;
      const record = {
        ...body,
        createdBy: req.user?.email || body.createdBy || 'system',
      };
      await db.insert(financialRecords).values(record);
      res.status(201).json(record);
    } catch (error: any) {
      console.error('Error creating financial record:', error);
      res.status(500).json({ error: error.message || 'Failed to create financial record' });
    }
  });

  app.put('/api/finances/:id', optionalAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const body = req.body;
      await db
        .update(financialRecords)
        .set(body)
        .where(eq(financialRecords.id, id));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating financial record:', error);
      res.status(500).json({ error: error.message || 'Failed to update financial record' });
    }
  });

  app.delete('/api/finances/:id', optionalAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await db.delete(financialRecords).where(eq(financialRecords.id, id));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting financial record:', error);
      res.status(500).json({ error: error.message || 'Failed to delete financial record' });
    }
  });

  // ==========================================
  // CLINIC EVENTS ROUTES
  // ==========================================
  app.get('/api/clinic-events', async (_req: Request, res: Response) => {
    try {
      const records = await db
        .select()
        .from(clinicEvents)
        .orderBy(clinicEvents.date);
      res.json(records);
    } catch (error: any) {
      console.error('Error fetching clinic events:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch clinic events' });
    }
  });

  app.post('/api/clinic-events', optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body;
      const record = {
        ...body,
        createdBy: req.user?.email || body.createdBy || 'system',
      };
      await db.insert(clinicEvents).values(record);
      res.status(201).json(record);
    } catch (error: any) {
      console.error('Error creating clinic event:', error);
      res.status(500).json({ error: error.message || 'Failed to create clinic event' });
    }
  });

  app.put('/api/clinic-events/:id', optionalAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const body = req.body;
      await db
        .update(clinicEvents)
        .set(body)
        .where(eq(clinicEvents.id, id));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating clinic event:', error);
      res.status(500).json({ error: error.message || 'Failed to update clinic event' });
    }
  });

  app.delete('/api/clinic-events/:id', optionalAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await db.delete(clinicEvents).where(eq(clinicEvents.id, id));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting clinic event:', error);
      res.status(500).json({ error: error.message || 'Failed to delete clinic event' });
    }
  });

  // ==========================================
  // VITE / STATIC SERVING
  // ==========================================
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
