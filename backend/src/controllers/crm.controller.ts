import { Response } from 'express';
import prisma from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getLeads(req: AuthenticatedRequest, res: Response) {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const leads = await prisma.lead.findMany({
      where: { tenantId },
      include: {
        counsellor: {
          select: { id: true, username: true, email: true }
        },
        followups: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    return res.status(200).json(leads);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createLead(req: AuthenticatedRequest, res: Response) {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const { name, phone, email, parentName, state, city, qualification, marksPercentage, preferredCourse, preferredCollege, budget, source, counsellorId, notes } = req.body;

    if (!name || !phone || !email) {
      return res.status(400).json({ error: 'Name, phone, and email are required' });
    }

    // Auto calculate lead score based on parameters
    let score = 50;
    if (parseFloat(marksPercentage) > 85) score += 15;
    if (parseFloat(budget) > 1000000) score += 15;
    if (preferredCollege) score += 10;
    if (source === 'Referral' || source === 'WhatsApp') score += 10;

    const lead = await prisma.lead.create({
      data: {
        tenantId,
        name,
        phone,
        email,
        parentName,
        state,
        city,
        qualification,
        marksPercentage: marksPercentage ? parseFloat(marksPercentage) : null,
        preferredCourse,
        preferredCollege,
        budget: budget ? parseFloat(budget) : null,
        source: source || 'Website',
        pipelineStage: 'New',
        leadScore: Math.min(score, 100),
        counsellorId: counsellorId || null,
        creatorId: req.user?.id || null,
        notes
      }
    });

    // Create an audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        userName: req.user?.email,
        action: 'CREATE_LEAD',
        details: `Created lead for ${name} (ID: ${lead.id})`
      }
    });

    return res.status(201).json(lead);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateLeadStage(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    if (!stage) return res.status(400).json({ error: 'Pipeline stage is required' });

    const lead = await prisma.lead.update({
      where: { id },
      data: { pipelineStage: stage }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        userName: req.user?.email,
        action: 'UPDATE_LEAD_STAGE',
        details: `Moved lead ${lead.name} (ID: ${lead.id}) to stage ${stage}`
      }
    });

    return res.status(200).json(lead);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateLead(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;

    // Destructure to remove ID, relations, and timestamps from database update data
    const {
      id: _,
      tenantId,
      createdAt,
      updatedAt,
      counsellor,
      followups,
      ...updateData
    } = data;

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...updateData,
        marksPercentage: updateData.marksPercentage ? parseFloat(updateData.marksPercentage) : undefined,
        budget: updateData.budget ? parseFloat(updateData.budget) : undefined,
        leadScore: updateData.leadScore ? parseInt(updateData.leadScore) : undefined,
      }
    });

    return res.status(200).json(lead);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function addFollowUp(req: AuthenticatedRequest, res: Response) {
  try {
    const { leadId, dateTime, type, notes } = req.body;

    if (!leadId || !dateTime || !type) {
      return res.status(400).json({ error: 'Lead ID, date/time, and follow-up type are required' });
    }

    const followUp = await prisma.followUp.create({
      data: {
        leadId,
        dateTime: new Date(dateTime),
        type,
        notes,
        isCompleted: false
      }
    });

    return res.status(201).json(followUp);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function completeFollowUp(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const followUp = await prisma.followUp.update({
      where: { id },
      data: { isCompleted: true }
    });

    return res.status(200).json(followUp);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getCounsellorStats(req: AuthenticatedRequest, res: Response) {
  try {
    const counsellorId = req.user?.id;
    if (!counsellorId) return res.status(401).json({ error: 'Unauthorized' });

    const leads = await prisma.lead.findMany({
      where: { counsellorId },
      include: { followups: true }
    });

    const activeFollowups = leads.flatMap(l => l.followups.filter(f => !f.isCompleted));
    const confirmedAdmissions = leads.filter(l => l.pipelineStage === 'Confirmed');

    return res.status(200).json({
      totalLeads: leads.length,
      activeFollowups: activeFollowups.length,
      confirmedAdmissions: confirmedAdmissions.length,
      targetAdmissions: 20, // Static target
      currentMonthCommission: confirmedAdmissions.length * 5000 // Mock 5000 INR per conversion
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
