import { Response } from 'express';
import prisma from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

// Helper to auto-create User (role: STUDENT) and StudentProfile when a Lead is confirmed
async function ensureStudentProfileForLead(lead: any) {
  try {
    // 1. Check if user already exists
    let user = await prisma.user.findFirst({
      where: { email: lead.email, tenantId: lead.tenantId }
    });

    if (!user) {
      // Create user account for student with default password
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = await prisma.user.create({
        data: {
          tenantId: lead.tenantId,
          email: lead.email,
          username: lead.name,
          passwordHash: hashedPassword,
          role: 'STUDENT',
        }
      });
      console.log(`Auto-created student user account for lead: ${lead.email}`);
    }

    // 2. Check if student profile already exists
    let studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id }
    });

    if (!studentProfile) {
      studentProfile = await prisma.studentProfile.create({
        data: {
          userId: user.id,
          parentName: lead.parentName || '',
          preferredCourse: lead.preferredCourse || '',
          preferredCollege: lead.preferredCollege || '',
          budgetLimit: lead.budget || 0,
          doc10thStatus: lead.docStatus || 'Pending',
          doc12thStatus: lead.docStatus || 'Pending',
          docGradStatus: 'Pending',
          docAadharStatus: lead.docStatus || 'Pending',
          docPANStatus: 'Pending',
          docPhotoStatus: 'Pending',
          docSignatureStatus: 'Pending',
        }
      });
      console.log(`Auto-created student profile for user ID: ${user.id}`);
    }
  } catch (err) {
    console.error('Error in ensureStudentProfileForLead:', err);
  }
}



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

    if (stage === 'Confirmed') {
      await ensureStudentProfileForLead(lead);
    }

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

    if (lead.pipelineStage === 'Confirmed') {
      await ensureStudentProfileForLead(lead);
    }

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
