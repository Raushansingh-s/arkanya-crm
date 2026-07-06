import { Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import prisma from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';

export async function login(req: AuthenticatedRequest, res: Response) {
  try {
    const { email, password, tenantSlug } = req.body;

    if (!email || !password || !tenantSlug) {
      return res.status(400).json({ error: 'Email, password, and workspace/tenant slug are required' });
    }

    // 1. Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Workspace/Tenant not found' });
    }

    // 2. Find user in tenant
    const user = await prisma.user.findFirst({
      where: {
        email,
        tenantId: tenant.id,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account has been deactivated' });
    }

    // 3. Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 4. Generate Token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // If student, get their profile details and lead record too
    let studentProfile = null;
    let lead = null;
    if (user.role === 'STUDENT') {
      studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: user.id },
      });
      lead = await prisma.lead.findFirst({
        where: { email: user.email, tenantId: user.tenantId },
      });
    }

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        tenantId: user.tenantId,
        studentProfile,
        lead,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor,
        accentColor: tenant.accentColor,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function registerStudent(req: AuthenticatedRequest, res: Response) {
  try {
    const { email, username, password, phone, tenantSlug, parentName, parentPhone, aadharNo, preferredCourse, preferredCollege, budgetLimit } = req.body;

    if (!email || !username || !password || !tenantSlug) {
      return res.status(400).json({ error: 'Email, username, password, and tenant slug are required' });
    }

    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        tenantId: tenant.id,
      },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User already registered under this workspace' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create User & Student Profile
    const newUser = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        username,
        passwordHash,
        role: 'STUDENT',
        phone,
        isActive: true,
      },
    });

    const newProfile = await prisma.studentProfile.create({
      data: {
        userId: newUser.id,
        parentName,
        parentPhone,
        aadharNo,
        preferredCourse,
        preferredCollege,
        budgetLimit: budgetLimit ? parseFloat(budgetLimit) : null,
        walletBalance: 0.0,
      },
    });

    // Also auto-create a lead in CRM for this student registration
    await prisma.lead.create({
      data: {
        tenantId: tenant.id,
        name: username,
        phone: phone || '',
        email,
        parentName,
        preferredCourse,
        preferredCollege,
        budget: budgetLimit ? parseFloat(budgetLimit) : null,
        source: 'Website',
        pipelineStage: 'New',
        leadScore: 60, // base score
        notes: 'Self-registered via Student Portal.',
      },
    });

    return res.status(201).json({
      message: 'Student registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        studentProfile: newProfile,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        studentProfile: true,
        tenant: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let lead = null;
    if (user.role === 'STUDENT') {
      lead = await prisma.lead.findFirst({
        where: { email: user.email, tenantId: user.tenantId },
      });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        tenantId: user.tenantId,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        studentProfile: user.studentProfile,
        tenant: user.tenant,
        lead,
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function sendOTP(req: AuthenticatedRequest, res: Response) {
  const { phone } = req.body;
  console.log(`OTP SMS triggered for ${phone}: Your verification code is 4829`);
  return res.status(200).json({ message: 'OTP Sent successfully', mockCode: '4829' });
}

export async function verifyOTP(req: AuthenticatedRequest, res: Response) {
  const { phone, code } = req.body;
  if (code === '4829') {
    return res.status(200).json({ message: 'OTP verified successfully' });
  }
  return res.status(400).json({ error: 'Invalid verification code' });
}


export async function getUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const users = await prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return res.status(200).json(users);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createUser(req: AuthenticatedRequest, res: Response) {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const { email, username, password, role } = req.body;
    if (!email || !username || !password || !role) {
      return res.status(400).json({ error: 'All fields (email, username, password, role) are required' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email, tenantId }
    });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists under this tenant' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        tenantId,
        email,
        username,
        passwordHash: hashedPassword,
        role,
      }
    });

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        isActive: newUser.isActive,
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { username, email, role, isActive } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        username,
        email,
        role,
        isActive: isActive !== undefined ? !!isActive : undefined
      }
    });

    return res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user?.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    await prisma.user.delete({
      where: { id }
    });

    return res.status(200).json({ message: 'User account deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function resetUserPassword(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'New password is required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id },
      data: { passwordHash: hashedPassword }
    });

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function uploadDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const requesterId = req.user?.id;
    const requesterRole = req.user?.role;
    if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });

    const { fieldName, fileName, fileData, leadId } = req.body;
    if (!fieldName || !fileName || !fileData) {
      return res.status(400).json({ error: 'fieldName, fileName, and fileData (base64) are required' });
    }

    let targetUserId = requesterId;

    // If leadId is provided and the requester is an admin/counsellor, find the corresponding student user
    if (leadId && ['SUPERADMIN', 'ADMIN', 'COUNSELLOR', 'MARKETING_DIRECTOR', 'FINANCE_DIRECTOR'].includes(requesterRole || '')) {
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }
      const studentUser = await prisma.user.findFirst({
        where: { email: lead.email, tenantId: lead.tenantId }
      });
      if (!studentUser) {
        return res.status(400).json({ error: 'No student user account exists for this lead yet. Stage must be moved to Counselling/DocPending first.' });
      }
      targetUserId = studentUser.id;
    }

    const fs = await import('fs');
    const path = await import('path');

    // Ensure uploads folder exists
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Decode base64 data
    const base64Data = fileData.replace(/^data:.*;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    const uniqueFileName = `${Date.now()}-${targetUserId}-${fileName.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    // Save file to disk
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${uniqueFileName}`;

    // Map the fieldName to DB fields
    const fieldMap: Record<string, { urlField: string; statusField: string }> = {
      marksheet10: { urlField: 'doc10thUrl', statusField: 'doc10thStatus' },
      marksheet12: { urlField: 'doc12thUrl', statusField: 'doc12thStatus' },
      aadhar: { urlField: 'docAadharUrl', statusField: 'docAadharStatus' },
      passport: { urlField: 'docPhotoUrl', statusField: 'docPhotoStatus' },
      casteCert: { urlField: 'docGradUrl', statusField: 'docGradStatus' },
      migCert: { urlField: 'docSignatureUrl', statusField: 'docSignatureStatus' },
    };

    const mapped = fieldMap[fieldName];
    if (mapped) {
      // Ensure student profile exists
      let profile = await prisma.studentProfile.findUnique({ where: { userId: targetUserId } });
      if (!profile) {
        // Auto-create profile if missing
        profile = await prisma.studentProfile.create({
          data: {
            userId: targetUserId,
            doc10thStatus: 'Pending',
            doc12thStatus: 'Pending',
            docGradStatus: 'Pending',
            docAadharStatus: 'Pending',
            docPANStatus: 'Pending',
            docPhotoStatus: 'Pending',
            docSignatureStatus: 'Pending',
          }
        });
      }

      await prisma.studentProfile.update({
        where: { userId: targetUserId },
        data: {
          [mapped.urlField]: fileUrl,
          [mapped.statusField]: 'Under Review',
        }
      });
    }

    // Update corresponding lead in CRM to 'Under Review' status
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (targetUser) {
      const lead = await prisma.lead.findFirst({ where: { email: targetUser.email, tenantId: targetUser.tenantId } });
      if (lead) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: { docStatus: 'Under Review' }
        });
      }
    }

    return res.status(200).json({ message: 'Document uploaded successfully', url: fileUrl });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return res.status(500).json({ error: error.message });
  }
}
