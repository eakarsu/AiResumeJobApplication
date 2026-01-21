import { Router, Response } from 'express';
import prisma from '../services/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { openRouterService } from '../services/openrouter';

const router = Router();

// Get all contacts
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { search, relationship, company, page = '1', limit = '20' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { userId: req.userId, isActive: true };
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    if (relationship) where.relationship = relationship;
    if (company) where.company = { contains: company as string, mode: 'insensitive' };

    const [contacts, total] = await Promise.all([
      prisma.networkContact.findMany({
        where,
        include: {
          interactions: {
            orderBy: { date: 'desc' },
            take: 3
          }
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.networkContact.count({ where })
    ]);

    res.json({
      contacts,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to get contacts' });
  }
});

// Get single contact
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const contact = await prisma.networkContact.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        interactions: {
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({ error: 'Failed to get contact' });
  }
});

// Create contact
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      position,
      linkedinUrl,
      relationship,
      notes,
      tags
    } = req.body;

    const contact = await prisma.networkContact.create({
      data: {
        userId: req.userId!,
        firstName,
        lastName,
        email,
        phone,
        company,
        position,
        linkedinUrl,
        relationship,
        notes,
        tags: tags || []
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'contact_added',
        entityType: 'contact',
        entityId: contact.id
      }
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// Update contact
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.networkContact.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const contact = await prisma.networkContact.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.json(contact);
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// Delete contact
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.networkContact.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await prisma.networkContact.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// Add interaction
router.post('/:id/interactions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const contact = await prisma.networkContact.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const { type, date, notes, outcome } = req.body;

    const interaction = await prisma.contactInteraction.create({
      data: {
        contactId: req.params.id,
        type,
        date: date ? new Date(date) : new Date(),
        notes,
        outcome
      }
    });

    // Update last contact date
    await prisma.networkContact.update({
      where: { id: req.params.id },
      data: { lastContactDate: new Date() }
    });

    res.status(201).json(interaction);
  } catch (error) {
    console.error('Add interaction error:', error);
    res.status(500).json({ error: 'Failed to add interaction' });
  }
});

// Get contacts needing follow-up
router.get('/followup/needed', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const contacts = await prisma.networkContact.findMany({
      where: {
        userId: req.userId,
        isActive: true,
        nextFollowUp: { lte: new Date() }
      },
      orderBy: { nextFollowUp: 'asc' }
    });

    res.json(contacts);
  } catch (error) {
    console.error('Get follow-up contacts error:', error);
    res.status(500).json({ error: 'Failed to get contacts needing follow-up' });
  }
});

// AI: Generate networking message
router.post('/ai/message', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { contactId, purpose, platform } = req.body;

    let recipientInfo = req.body.recipientInfo;

    if (contactId) {
      const contact = await prisma.networkContact.findFirst({
        where: { id: contactId, userId: req.userId }
      });
      if (contact) {
        recipientInfo = `${contact.firstName} ${contact.lastName}, ${contact.position || ''} at ${contact.company || ''}`;
      }
    }

    // Get user info for background
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        resumes: {
          where: { isActive: true },
          take: 1,
          select: { summary: true, skills: true }
        }
      }
    });

    const yourBackground = user?.resumes[0]
      ? `${user.resumes[0].summary || ''} Skills: ${user.resumes[0].skills.join(', ')}`
      : undefined;

    const message = await openRouterService.generateNetworkingMessage({
      purpose,
      recipientInfo,
      yourBackground,
      platform
    });

    res.json({ message });
  } catch (error) {
    console.error('AI networking message error:', error);
    res.status(500).json({ error: 'Failed to generate networking message' });
  }
});

// AI: Generate follow-up email
router.post('/ai/follow-up', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { contactId, context, tone } = req.body;

    let recipientName, recipientRole;

    if (contactId) {
      const contact = await prisma.networkContact.findFirst({
        where: { id: contactId, userId: req.userId }
      });
      if (contact) {
        recipientName = `${contact.firstName} ${contact.lastName}`;
        recipientRole = contact.position;
      }
    }

    const email = await openRouterService.generateFollowUpEmail({
      context,
      recipientName,
      recipientRole,
      tone
    });

    res.json({ email });
  } catch (error) {
    console.error('AI follow-up email error:', error);
    res.status(500).json({ error: 'Failed to generate follow-up email' });
  }
});

// Get contact statistics
router.get('/stats/summary', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const [totalContacts, byRelationship, recentInteractions] = await Promise.all([
      prisma.networkContact.count({
        where: { userId: req.userId, isActive: true }
      }),
      prisma.networkContact.groupBy({
        by: ['relationship'],
        where: { userId: req.userId, isActive: true },
        _count: { relationship: true }
      }),
      prisma.contactInteraction.count({
        where: {
          contact: { userId: req.userId },
          date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      })
    ]);

    res.json({
      totalContacts,
      byRelationship: byRelationship.reduce((acc, r) => {
        if (r.relationship) acc[r.relationship] = r._count.relationship;
        return acc;
      }, {} as Record<string, number>),
      recentInteractions
    });
  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

export default router;
