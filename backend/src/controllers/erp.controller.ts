import { Response } from 'express';
import prisma from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getUniversities(req: AuthenticatedRequest, res: Response) {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const universities = await prisma.university.findMany({
      where: { tenantId },
      include: { colleges: true }
    });

    return res.status(200).json(universities);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createUniversity(req: AuthenticatedRequest, res: Response) {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const { name, logoUrl, ugcApproved, aicteApproved, naacGrade, nirfRanking, website, email, phone, state, city } = req.body;

    if (!name || !state || !city) {
      return res.status(400).json({ error: 'University name, state, and city are required' });
    }

    const university = await prisma.university.create({
      data: {
        tenantId,
        name,
        logoUrl: logoUrl || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=150&h=150&q=80',
        ugcApproved: !!ugcApproved,
        aicteApproved: !!aicteApproved,
        naacGrade,
        nirfRanking: nirfRanking ? parseInt(nirfRanking) : null,
        website,
        email,
        phone,
        state,
        city
      }
    });

    return res.status(201).json(university);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateUniversity(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, logoUrl, ugcApproved, aicteApproved, naacGrade, nirfRanking, website, email, phone, state, city } = req.body;

    const university = await prisma.university.update({
      where: { id },
      data: {
        name,
        logoUrl: logoUrl !== undefined ? logoUrl : undefined,
        ugcApproved: ugcApproved !== undefined ? !!ugcApproved : undefined,
        aicteApproved: aicteApproved !== undefined ? !!aicteApproved : undefined,
        naacGrade,
        nirfRanking: nirfRanking ? parseInt(nirfRanking) : null,
        website,
        email,
        phone,
        state,
        city
      }
    });

    return res.status(200).json(university);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getColleges(req: AuthenticatedRequest, res: Response) {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const colleges = await prisma.college.findMany({
      where: { tenantId },
      include: {
        university: true,
        courses: true,
        collaborations: true
      }
    });

    return res.status(200).json(colleges);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createCollege(req: AuthenticatedRequest, res: Response) {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const { universityId, name, state, district, address, contactPerson, phone, email, website, naacGrade, aicteApproved, ugcApproved, ranking, hostelDetails, placementStats, highestPackage, averagePackage, infrastructureNotes } = req.body;

    if (!universityId || !name || !state || !address) {
      return res.status(400).json({ error: 'universityId, name, state, and address are required' });
    }

    const college = await prisma.college.create({
      data: {
        tenantId,
        universityId,
        name,
        state,
        district,
        address,
        contactPerson,
        phone,
        email,
        website,
        naacGrade,
        aicteApproved: !!aicteApproved,
        ugcApproved: !!ugcApproved,
        ranking: ranking ? parseInt(ranking) : null,
        hostelDetails,
        placementStats,
        highestPackage: highestPackage ? parseFloat(highestPackage) : null,
        averagePackage: averagePackage ? parseFloat(averagePackage) : null,
        infrastructureNotes
      }
    });

    return res.status(201).json(college);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getCourses(req: AuthenticatedRequest, res: Response) {
  try {
    const courses = await prisma.course.findMany({
      include: {
        college: {
          include: { university: true }
        }
      }
    });
    return res.status(200).json(courses);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createCourse(req: AuthenticatedRequest, res: Response) {
  try {
    const { collegeId, degree, branch, eligibility, durationYears, totalFees, semesterFees, registrationFees, examFees, hostelFees, seatsTotal } = req.body;

    if (!collegeId || !degree || !branch || !totalFees) {
      return res.status(400).json({ error: 'College ID, degree, branch, and total fees are required' });
    }

    const course = await prisma.course.create({
      data: {
        collegeId,
        degree,
        branch,
        eligibility,
        durationYears: parseInt(durationYears),
        totalFees: parseFloat(totalFees),
        semesterFees: parseFloat(semesterFees),
        registrationFees: registrationFees ? parseFloat(registrationFees) : 0,
        examFees: examFees ? parseFloat(examFees) : 0,
        hostelFees: hostelFees ? parseFloat(hostelFees) : 0,
        seatsTotal: seatsTotal ? parseInt(seatsTotal) : 60,
        seatsBooked: 0,
        seatsWaiting: 0
      }
    });

    return res.status(201).json(course);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getCollaborations(req: AuthenticatedRequest, res: Response) {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const collaborations = await prisma.collaboration.findMany({
      where: { tenantId },
      include: {
        college: true
      }
    });

    return res.status(200).json(collaborations);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createCollaboration(req: AuthenticatedRequest, res: Response) {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    const { collegeId, startDate, expiryDate, commissionPercent, fixedCommission, admissionContact, paymentTerms, notes } = req.body;

    if (!collegeId || !startDate || !expiryDate) {
      return res.status(400).json({ error: 'College ID, start date, and expiry date are required' });
    }

    const collaboration = await prisma.collaboration.create({
      data: {
        tenantId,
        collegeId,
        startDate: new Date(startDate),
        expiryDate: new Date(expiryDate),
        commissionPercent: commissionPercent ? parseFloat(commissionPercent) : 0,
        fixedCommission: fixedCommission ? parseFloat(fixedCommission) : 0,
        admissionContact,
        paymentTerms,
        status: 'Active',
        notes
      }
    });

    return res.status(201).json(collaboration);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function bookSeat(req: AuthenticatedRequest, res: Response) {
  try {
    const { courseId } = req.body;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    if (course.seatsBooked >= course.seatsTotal) {
      // Add to waiting list
      const updatedCourse = await prisma.course.update({
        where: { id: courseId },
        data: { seatsWaiting: { increment: 1 } }
      });
      return res.status(200).json({ message: 'Seat full. Added to waiting list.', course: updatedCourse, status: 'waiting' });
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: { seatsBooked: { increment: 1 } }
    });

    return res.status(200).json({ message: 'Seat booked successfully.', course: updatedCourse, status: 'booked' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}


export async function updateCollege(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { universityId, name, state, district, address, contactPerson, phone, email, website, naacGrade, aicteApproved, ugcApproved, ranking, hostelDetails, placementStats, highestPackage, averagePackage, infrastructureNotes } = req.body;

    const college = await prisma.college.update({
      where: { id },
      data: {
        universityId,
        name,
        state,
        district,
        address,
        contactPerson,
        phone,
        email,
        website,
        naacGrade,
        aicteApproved: aicteApproved !== undefined ? !!aicteApproved : undefined,
        ugcApproved: ugcApproved !== undefined ? !!ugcApproved : undefined,
        ranking: ranking ? parseInt(ranking) : null,
        hostelDetails,
        placementStats,
        highestPackage: highestPackage ? parseFloat(highestPackage) : null,
        averagePackage: averagePackage ? parseFloat(averagePackage) : null,
        infrastructureNotes
      }
    });

    return res.status(200).json(college);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateCourse(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { degree, branch, eligibility, durationYears, totalFees, semesterFees, registrationFees, examFees, hostelFees, seatsTotal } = req.body;

    const course = await prisma.course.update({
      where: { id },
      data: {
        degree,
        branch,
        eligibility,
        durationYears: durationYears ? parseInt(durationYears) : undefined,
        totalFees: totalFees ? parseFloat(totalFees) : undefined,
        semesterFees: semesterFees ? parseFloat(semesterFees) : undefined,
        registrationFees: registrationFees ? parseFloat(registrationFees) : undefined,
        examFees: examFees ? parseFloat(examFees) : undefined,
        hostelFees: hostelFees ? parseFloat(hostelFees) : undefined,
        seatsTotal: seatsTotal ? parseInt(seatsTotal) : undefined,
      }
    });

    return res.status(200).json(course);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
