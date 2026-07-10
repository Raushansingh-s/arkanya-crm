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
      // Generate a secure random password for the student
      const crypto = await import('crypto');
      const rawPassword = crypto.randomBytes(8).toString('hex'); // 16-char random hex password
      const hashedPassword = await bcrypt.hash(rawPassword, 10);
      user = await prisma.user.create({
        data: {
          tenantId: lead.tenantId,
          email: lead.email,
          username: lead.name,
          passwordHash: hashedPassword,
          role: 'STUDENT',
        }
      });
      // Log password ONLY in server console (admin/DevOps can retrieve from logs and share with student)
      console.log(`[STUDENT ACCOUNT CREATED] Email: ${lead.email} | Temporary Password: ${rawPassword} | Share via secure channel.`);
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
          address: lead.address || '',
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

    const leadsWithProfiles = await Promise.all(leads.map(async (lead) => {
      const user = await prisma.user.findFirst({
        where: { email: lead.email, tenantId: lead.tenantId },
        include: { studentProfile: true }
      });
      return {
        ...lead,
        studentProfile: user?.studentProfile || null
      };
    }));

    return res.status(200).json(leadsWithProfiles);
  } catch (error: any) {
    console.error('Get leads error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
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
    console.error('Create lead error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
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

    if (['Counselling', 'DocPending', 'Confirmed', 'Applied'].includes(stage)) {
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
    console.error('Update lead stage error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function updateLead(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;

    const existingLead = await prisma.lead.findUnique({
      where: { id }
    });

    if (!existingLead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const studentUser = await prisma.user.findFirst({
      where: { email: existingLead.email, tenantId: existingLead.tenantId },
      include: { studentProfile: true }
    });
    const existingProfile = studentUser?.studentProfile;

    const isProfileFilled = !!(
      existingLead.name && existingLead.name.trim() !== '' &&
      existingLead.email && existingLead.email.trim() !== '' &&
      existingLead.phone && existingLead.phone.trim() !== '' &&
      existingLead.address && existingLead.address.trim() !== '' &&
      existingLead.state && existingLead.state.trim() !== '' &&
      existingLead.city && existingLead.city.trim() !== '' &&
      existingLead.qualification && existingLead.qualification.trim() !== '' &&
      existingLead.marksPercentage !== null && existingLead.marksPercentage !== undefined &&
      existingLead.preferredCourse && existingLead.preferredCourse.trim() !== '' &&
      existingLead.budget !== null && existingLead.budget !== undefined &&
      existingLead.preferredCollege && existingLead.preferredCollege.trim() !== '' &&
      existingProfile &&
      existingProfile.parentName && existingProfile.parentName.trim() !== '' &&
      existingProfile.parentPhone && existingProfile.parentPhone.trim() !== '' &&
      existingProfile.category && existingProfile.category.trim() !== '' &&
      existingProfile.aadharNo && existingProfile.aadharNo.trim() !== '' &&
      existingProfile.panNo && existingProfile.panNo.trim() !== ''
    );

    const isCounsellor = req.user?.role === 'COUNSELLOR';

    if (isProfileFilled && isCounsellor) {
      const lockedFields = [
        'name', 'phone', 'email', 'parentName', 'state', 'city', 
        'qualification', 'marksPercentage', 'preferredCourse', 
        'preferredCollege', 'budget', 'source'
      ];

      for (const field of lockedFields) {
        const updatedValue = data[field];
        const existingValue = (existingLead as any)[field];
        
        // Normalize values to avoid mismatch between null/undefined/empty string
        const normUpdated = updatedValue === undefined || updatedValue === null ? '' : String(updatedValue).trim();
        const normExisting = existingValue === undefined || existingValue === null ? '' : String(existingValue).trim();

        if (updatedValue !== undefined && normUpdated !== normExisting) {
          return res.status(403).json({ 
            error: `This profile is locked for editing. You cannot modify the '${field}' field.` 
          });
        }
      }

      if (data.studentProfile && existingProfile) {
        const profileLockedFields = [
          'parentName', 'parentPhone', 'category', 'aadharNo', 'panNo'
        ];
        for (const field of profileLockedFields) {
          const updatedValue = data.studentProfile[field];
          const existingValue = (existingProfile as any)[field];

          const normUpdated = updatedValue === undefined || updatedValue === null ? '' : String(updatedValue).trim();
          const normExisting = existingValue === undefined || existingValue === null ? '' : String(existingValue).trim();

          if (updatedValue !== undefined && normUpdated !== normExisting) {
            return res.status(403).json({ 
              error: `This profile is locked for editing. You cannot modify the student profile '${field}' field.` 
            });
          }
        }
      }
    }

    // Destructure to remove ID, relations, and timestamps from database update data
    const {
      id: _,
      tenantId,
      createdAt,
      updatedAt,
      counsellor,
      followups,
      studentProfile,
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

    if (['Counselling', 'DocPending', 'Confirmed', 'Applied'].includes(lead.pipelineStage)) {
      await ensureStudentProfileForLead(lead);
    }

    if (studentProfile) {
      const user = await prisma.user.findFirst({
        where: { email: lead.email, tenantId: lead.tenantId }
      });
      if (user) {
        const { id: spId, userId: spUserId, user: spUser, walletBalance: _, ...profileUpdate } = studentProfile;
        await prisma.studentProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            ...profileUpdate,
            address: profileUpdate.address || lead.address || '',
            parentPhone: profileUpdate.parentPhone || '',
            preferredCourse: lead.preferredCourse || '',
            preferredCollege: lead.preferredCollege || '',
          },
          update: {
            ...profileUpdate,
            address: profileUpdate.address || lead.address || '',
            parentPhone: profileUpdate.parentPhone || '',
          }
        });
      }
    }

    return res.status(200).json(lead);
  } catch (error: any) {
    console.error('Update lead error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
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
    console.error('Add follow-up error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
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
    console.error('Complete follow-up error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
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
    console.error('Get counsellor stats error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function resetStudentPassword(req: AuthenticatedRequest, res: Response) {
  try {
    const { leadId, newPassword } = req.body;
    if (!leadId || !newPassword) {
      return res.status(400).json({ error: 'leadId and newPassword are required' });
    }

    const requesterRole = req.user?.role;
    if (!['SUPERADMIN', 'ADMIN', 'COUNSELLOR', 'MARKETING_DIRECTOR', 'FINANCE_DIRECTOR'].includes(requesterRole || '')) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to reset student passwords.' });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const studentUser = await prisma.user.findFirst({
      where: { email: lead.email, tenantId: lead.tenantId }
    });

    if (!studentUser) {
      return res.status(404).json({ error: 'No student user account exists for this lead.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: studentUser.id },
      data: { passwordHash: hashedPassword }
    });

    return res.status(200).json({ message: 'Student password updated successfully.' });
  } catch (error: any) {
    console.error('Error resetting student password:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
