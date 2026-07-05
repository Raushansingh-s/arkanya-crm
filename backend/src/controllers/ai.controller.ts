import { Response } from 'express';
import prisma from '../utils/db';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getCollegeRecommendations(req: AuthenticatedRequest, res: Response) {
  try {
    const { qualificationPercentage, budget, preferredCourse } = req.body;

    const percentage = parseFloat(qualificationPercentage || '75');
    const studentBudget = parseFloat(budget || '1500000');
    const courseType = preferredCourse || 'B.Tech';

    // Query courses in colleges under the tenant
    const courses = await prisma.course.findMany({
      include: {
        college: true
      }
    });

    const recommendations = courses.map(course => {
      let score = 50;

      // Match course degree
      if (course.degree.toLowerCase().includes(courseType.toLowerCase())) {
        score += 20;
      }

      // Budget scoring
      if (course.totalFees <= studentBudget) {
        score += 20;
      } else {
        score -= Math.round((course.totalFees - studentBudget) / 50000);
      }

      // Academics matching
      if (percentage >= 85 && course.college.naacGrade === 'A++') {
        score += 10;
      } else if (percentage >= 70 && course.college.naacGrade?.startsWith('A')) {
        score += 5;
      }

      return {
        courseId: course.id,
        collegeName: course.college.name,
        degree: course.degree,
        branch: course.branch,
        totalFees: course.totalFees,
        eligibility: course.eligibility,
        matchScore: Math.max(10, Math.min(99, score)),
        reason: score > 75 
          ? 'Highly suitable based on your academic profile and budget margins.' 
          : 'Suitable option, though check if fee structures or criteria require special clearance.'
      };
    }).sort((a, b) => b.matchScore - a.matchScore);

    return res.status(200).json(recommendations.slice(0, 3));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function predictAdmissionChance(req: AuthenticatedRequest, res: Response) {
  try {
    const { courseId, studentPercentage } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { college: true }
    });

    if (!course) return res.status(404).json({ error: 'Course not found' });

    const percentage = parseFloat(studentPercentage || '70');
    let probability = 50; // base chance

    // Academics criteria
    if (percentage > 90) probability += 35;
    else if (percentage > 80) probability += 25;
    else if (percentage > 70) probability += 15;
    else if (percentage > 60) probability += 5;

    // Seat Availability impact
    const occupancyRate = course.seatsBooked / course.seatsTotal;
    if (occupancyRate > 0.95) {
      probability -= 25; // extremely low seats left
    } else if (occupancyRate > 0.8) {
      probability -= 15;
    } else if (occupancyRate < 0.5) {
      probability += 10; // plenty of seats
    }

    // NAAC grade impact
    if (course.college.naacGrade === 'A++') {
      probability -= 10; // harder to get in
    }

    const finalChance = Math.max(5, Math.min(98, probability));
    let advice = 'Good chance of admission. Keep documents prepared for immediate registration.';
    if (finalChance < 40) {
      advice = 'High waiting list occupancy. We suggest exploring alternative branch selections or sister colleges.';
    } else if (finalChance > 85) {
      advice = 'Outstanding match. You easily cross the historical cutoffs. Proceed directly with seat booking.';
    }

    return res.status(200).json({
      chancePercentage: finalChance,
      advice,
      details: {
        seatsRemaining: course.seatsTotal - course.seatsBooked,
        academicMatch: percentage > 75 ? 'Strong' : 'Average',
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getScholarships(req: AuthenticatedRequest, res: Response) {
  try {
    const { percentage } = req.body;
    const marks = parseFloat(percentage || '75');

    const scholarships = [
      {
        name: 'Arkanya Merit Scholarship',
        criteria: 'Academics > 90% in 12th standard',
        benefit: 'Up to 50% discount on first-year tuition fees',
        eligibilityStatus: marks >= 90 ? 'Eligible' : 'Not Eligible (Requires >90%)',
        discountPercent: marks >= 90 ? 50 : 0
      },
      {
        name: 'Regional Talent Support Payout',
        criteria: 'Academics > 75% in 12th standard',
        benefit: 'Flat 20,000 INR discount on registration clearances',
        eligibilityStatus: marks >= 75 ? 'Eligible' : 'Not Eligible (Requires >75%)',
        discountPercent: marks >= 75 ? 15 : 0
      },
      {
        name: 'Girl Child Empowerment Scholarship',
        criteria: 'Female students with Academics > 65%',
        benefit: '10% tuition fee wave across all semesters',
        eligibilityStatus: marks >= 65 ? 'Conditional' : 'Not Eligible (Requires >65%)',
        discountPercent: 10
      }
    ];

    return res.status(200).json(scholarships);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function simulateDocumentVerification(req: AuthenticatedRequest, res: Response) {
  try {
    const { documentType, documentUrl } = req.body;

    if (!documentType || !documentUrl) {
      return res.status(400).json({ error: 'Document type and URL are required' });
    }

    // Mock OCR parsing & verification
    const isSuccess = !documentUrl.includes('invalid') && !documentUrl.includes('corrupted');
    const score = isSuccess ? 96 : 32;

    return res.status(200).json({
      verified: isSuccess,
      confidenceScore: score,
      details: isSuccess 
        ? {
            parsedName: 'RAHUL SEN',
            documentNumber: 'XXXX-XXXX-9012',
            issueDate: '15/06/2024',
            notes: 'AI Verification Succeeded: All OCR fields matched with registration profile.'
          }
        : {
            errorMsg: 'OCR Read Failure: Image fuzzy or metadata mismatch.',
            notes: 'AI Flags: Please upload a clear high-resolution scanned copy of the document.'
          }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function chatAssistant(req: AuthenticatedRequest, res: Response) {
  try {
    const { message, context } = req.body;

    if (!message) return res.status(400).json({ error: 'Message query required' });

    let reply = "Hello! I am Arkanya's Admission Assistant. How can I help you find colleges today?";
    let autoEmailDraft = "";
    let autoWhatsAppDraft = "";

    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('admission') || lowerMessage.includes('apply')) {
      reply = "To apply, simply go to your Student Dashboard, fill out the application form, and upload your Class 10th and 12th certificates. Our AI scanner will verify them instantly.";
      autoEmailDraft = "Subject: Action Required - Complete your Admission Application\n\nDear Student,\n\nWe noticed you are exploring admission options. Please upload your documents on the portal to secure your seat reservation.\n\nWarm regards,\nArkanya Admissions Team";
      autoWhatsAppDraft = "Hi! Complete your Arkanya admission registration by uploading your certificates today: arkanya.edutech.in/portal";
    } else if (lowerMessage.includes('fees') || lowerMessage.includes('cost')) {
      reply = "Courses at Arkanya partner colleges range from 8 Lakhs to 14 Lakhs. You can also explore Merit Scholarships which offer up to 50% discount based on your board percentage.";
      autoEmailDraft = "Subject: Details regarding Course Fees and Scholarships\n\nDear Parent,\n\nPlease find attached the structured fee breaks and scholarship packages for B.Tech CSE at Amity and KIIT.\n\nBest,\nArkanya Finance Office";
      autoWhatsAppDraft = "Hello! Here is the fee matrix and direct scholarship details you requested: arkanya.edutech.in/fees";
    } else if (lowerMessage.includes('rec') || lowerMessage.includes('suggest') || lowerMessage.includes('recommend')) {
      reply = "Based on your interest, I recommend looking at B.Tech Computer Science at KIIT Bhubaneswar. It has a stellar 8.5 LPA average package and is NAAC A+ rated.";
      autoEmailDraft = "Subject: Top College Suggestions for B.Tech CSE\n\nDear Student,\n\nBased on your marks, KIIT Bhubaneswar and Amity School of Engineering are top recommended slots.\n\nRegards,\nAditi Sharma";
      autoWhatsAppDraft = "Hey! Check out these top recommended courses suited for your profile: KIIT B.Tech CSE, Amity B.Tech CSE.";
    }

    return res.status(200).json({
      reply,
      suggestedActions: [
        'Run College Recommendation Engine',
        'Verify Documents',
        'Simulate OTP check'
      ],
      autoEmailDraft,
      autoWhatsAppDraft
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
