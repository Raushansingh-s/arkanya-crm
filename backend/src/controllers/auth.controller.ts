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
