import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'arkanya' },
    update: {},
    create: {
      slug: 'arkanya',
      name: 'Arkanya Edutech Pvt. Ltd.',
      logoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aba9?auto=format&fit=crop&w=200&h=200&q=80',
      domain: 'arkanya.edutech.in',
      primaryColor: '#0f172a',
      accentColor: '#3b82f6',
    },
  });
  console.log(`Tenant created: ${tenant.name}`);

  // Hash Password helper
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 2. Create Users (Roles)
  const usersToCreate = [
    {
      email: 'admin@arkanya.in',
      username: 'Super Admin',
      role: 'SUPERADMIN',
      phone: '+919999999901',
    },
    {
      email: 'finance.director@arkanya.in',
      username: 'Director (Finance & ERP)',
      role: 'DIRECTOR_FINANCE',
      phone: '+919999999902',
    },
    {
      email: 'marketing.director@arkanya.in',
      username: 'Director (Marketing & Admissions)',
      role: 'DIRECTOR_ACADEMICS',
      phone: '+919999999903',
    },
    {
      email: 'legal.director@arkanya.in',
      username: 'Director (Legal & Govt Projects)',
      role: 'DIRECTOR_LEGAL',
      phone: '+919999999904',
    },
    {
      email: 'counsellor1@arkanya.in',
      username: 'Aditi Sharma (Senior Counsellor)',
      role: 'COUNSELLOR',
      phone: '+919876543210',
    },
    {
      email: 'counsellor2@arkanya.in',
      username: 'Rohan Mehta (Junior Counsellor)',
      role: 'COUNSELLOR',
      phone: '+919876543211',
    },
    {
      email: 'telecaller1@arkanya.in',
      username: 'Pooja Verma (Telecaller)',
      role: 'TELECALLER',
      phone: '+919876543212',
    },
    {
      email: 'accountant@arkanya.in',
      username: 'Suresh Iyer (Head Accountant)',
      role: 'ACCOUNTANT',
      phone: '+919876543213',
    },
    {
      email: 'student@arkanya.in',
      username: 'Rahul Sen (Student)',
      role: 'STUDENT',
      phone: '+919000000001',
    },
  ];

  const users: Record<string, any> = {};

  for (const u of usersToCreate) {
    users[u.email] = await prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: u.email,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        email: u.email,
        username: u.username,
        passwordHash,
        role: u.role,
        phone: u.phone,
        isActive: true,
      },
    });
  }
  console.log(`Users seeded successfully: ${Object.keys(users).length}`);

  // Create Student Profile for student
  await prisma.studentProfile.upsert({
    where: { userId: users['student@arkanya.in'].id },
    update: {},
    create: {
      userId: users['student@arkanya.in'].id,
      parentName: 'Ramesh Sen',
      parentPhone: '+919000000002',
      aadharNo: '1234-5678-9012',
      panNo: 'ABCDE1234F',
      category: 'OBC',
      qualification10th: 85.5,
      qualification12th: 88.0,
      preferredCourse: 'B.Tech CSE',
      preferredCollege: 'Amity Institute of Technology',
      budgetLimit: 1200000,
      walletBalance: 25000,
      doc10thStatus: 'Approved',
      doc12thStatus: 'Approved',
      docAadharStatus: 'Approved',
      docPANStatus: 'Pending',
      doc10thUrl: 'https://example.com/docs/10th.pdf',
      doc12thUrl: 'https://example.com/docs/12th.pdf',
      docAadharUrl: 'https://example.com/docs/aadhar.jpg',
    },
  });

  // 3. Create Universities
  const uni1 = await prisma.university.create({
    data: {
      tenantId: tenant.id,
      name: 'Amity University',
      logoUrl: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=150&h=150&q=80',
      ugcApproved: true,
      aicteApproved: true,
      naacGrade: 'A++',
      nirfRanking: 35,
      website: 'https://amity.edu',
      email: 'admissions@amity.edu',
      phone: '+911204392000',
      state: 'Uttar Pradesh',
      city: 'Noida',
    },
  });

  const uni2 = await prisma.university.create({
    data: {
      tenantId: tenant.id,
      name: 'Kalinga Institute of Industrial Technology (KIIT)',
      logoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=150&h=150&q=80',
      ugcApproved: true,
      aicteApproved: true,
      naacGrade: 'A+',
      nirfRanking: 29,
      website: 'https://kiit.ac.in',
      email: 'admissions@kiit.ac.in',
      phone: '+916742725113',
      state: 'Odisha',
      city: 'Bhubaneswar',
    },
  });

  console.log('Universities seeded.');

  // 4. Create Colleges
  const col1 = await prisma.college.create({
    data: {
      tenantId: tenant.id,
      universityId: uni1.id,
      name: 'Amity School of Engineering & Technology',
      state: 'Uttar Pradesh',
      district: 'Gautam Buddha Nagar',
      address: 'Sector 125, Noida Expressway',
      contactPerson: 'Dr. Alok Verma',
      phone: '+919871029384',
      email: 'aset@amity.edu',
      website: 'https://amity.edu/aset',
      naacGrade: 'A++',
      aicteApproved: true,
      ugcApproved: true,
      ranking: 42,
      hostelDetails: 'Separate boys and girls AC/Non-AC hostels, multi-cuisine mess, 24/7 wifi.',
      placementStats: 'Highest package: 45 LPA, Average package: 7.2 LPA.',
      highestPackage: 45.0,
      averagePackage: 7.2,
      infrastructureNotes: 'State-of-the-art labs, sports complex, Olympic size swimming pool, central AC library.',
    },
  });

  const col2 = await prisma.college.create({
    data: {
      tenantId: tenant.id,
      universityId: uni2.id,
      name: 'KIIT School of Computer Engineering',
      state: 'Odisha',
      district: 'Khurda',
      address: 'Patia, Bhubaneswar',
      contactPerson: 'Prof. Samaresh Mishra',
      phone: '+916742740321',
      email: 'director.cse@kiit.ac.in',
      website: 'https://computer.kiit.ac.in',
      naacGrade: 'A+',
      aicteApproved: true,
      ugcApproved: true,
      ranking: 31,
      hostelDetails: '20+ hostels, premium security, indoor sports complexes, modular rooms.',
      placementStats: '100% placements. Major recruiters: Amazon, Microsoft, HighRadius, Deloitte.',
      highestPackage: 52.0,
      averagePackage: 8.5,
      infrastructureNotes: 'Industry sponsored labs, campus-wide smart classrooms, innovation hubs.',
    },
  });

  console.log('Colleges seeded.');

  // 5. Create Courses & Seat Matrices
  await prisma.course.createMany({
    data: [
      {
        collegeId: col1.id,
        degree: 'B.Tech',
        branch: 'Computer Science & Engineering',
        eligibility: '12th standard with minimum 60% aggregate in Physics, Chemistry, Mathematics',
        durationYears: 4,
        totalFees: 1440000,
        semesterFees: 180000,
        registrationFees: 20000,
        examFees: 5000,
        hostelFees: 120000,
        seatsTotal: 180,
        seatsBooked: 165, // ~91% - Trigger Yellow/Red
        seatsWaiting: 12,
      },
      {
        collegeId: col1.id,
        degree: 'MBA',
        branch: 'Business Analytics',
        eligibility: 'Graduation with min 50% score + CAT/MAT/GMAT cutoff',
        durationYears: 2,
        totalFees: 820000,
        semesterFees: 205000,
        registrationFees: 15000,
        examFees: 6000,
        hostelFees: 120000,
        seatsTotal: 60,
        seatsBooked: 24, // ~40% - Green
        seatsWaiting: 0,
      },
      {
        collegeId: col2.id,
        degree: 'B.Tech',
        branch: 'Information Technology',
        eligibility: '12th standard with 60% aggregate in PCM',
        durationYears: 4,
        totalFees: 1390000,
        semesterFees: 173750,
        registrationFees: 25000,
        examFees: 4000,
        hostelFees: 95000,
        seatsTotal: 120,
        seatsBooked: 119, // ~99% - Red
        seatsWaiting: 15,
      },
      {
        collegeId: col2.id,
        degree: 'B.Tech',
        branch: 'Electronics & Communication',
        eligibility: '12th standard with 60% aggregate in PCM',
        durationYears: 4,
        totalFees: 1200000,
        semesterFees: 150000,
        registrationFees: 25000,
        examFees: 4000,
        hostelFees: 95000,
        seatsTotal: 120,
        seatsBooked: 45, // ~37% - Green
        seatsWaiting: 0,
      },
    ],
  });

  console.log('Courses and Seat Matrices seeded.');

  // 6. Create Collaboration Agreements
  await prisma.collaboration.createMany({
    data: [
      {
        tenantId: tenant.id,
        collegeId: col1.id,
        startDate: new Date('2025-04-01'),
        expiryDate: new Date('2027-03-31'),
        commissionPercent: 12.5,
        fixedCommission: 15000.0,
        admissionContact: 'Mr. Pranav Gupta (Admissions ASET)',
        paymentTerms: '50% on registration clearance, 50% post first semester fee collection',
        status: 'Active',
        notes: 'Premium agreement with annual performance bonuses.',
      },
      {
        tenantId: tenant.id,
        collegeId: col2.id,
        startDate: new Date('2024-06-01'),
        expiryDate: new Date('2026-05-31'),
        commissionPercent: 15.0,
        fixedCommission: 0.0,
        admissionContact: 'Ms. Priyambada Panda',
        paymentTerms: '100% payout within 30 days of registration verification.',
        status: 'Active',
        notes: 'Requires active follow-up before expiry in May 2026.',
      },
    ],
  });

  console.log('Collaboration agreements seeded.');

  // 7. Create CRM Leads
  const leads = await prisma.lead.createMany({
    data: [
      {
        tenantId: tenant.id,
        name: 'Aarav Gupta',
        phone: '+919111222333',
        email: 'aarav.g@gmail.com',
        parentName: 'Sanjay Gupta',
        state: 'Delhi',
        city: 'New Delhi',
        qualification: '12th Pass',
        marksPercentage: 92.4,
        preferredCourse: 'B.Tech CSE',
        preferredCollege: 'KIIT School of Computer Engineering',
        budget: 1500000,
        source: 'Website',
        pipelineStage: 'New',
        leadScore: 88,
        counsellorId: users['counsellor1@arkanya.in'].id,
        notes: 'Aarav is very keen on KIIT Bhubaneswar. Parents are ready to pay registration fee early.',
      },
      {
        tenantId: tenant.id,
        name: 'Simran Kaur',
        phone: '+919222333444',
        email: 'simran.kaur98@yahoo.com',
        parentName: 'Harpreet Singh',
        state: 'Punjab',
        city: 'Amritsar',
        qualification: 'BBA Graduate',
        marksPercentage: 74.2,
        preferredCourse: 'MBA',
        preferredCollege: 'Amity School of Engineering & Technology',
        budget: 1000000,
        source: 'Facebook',
        pipelineStage: 'Counselling',
        leadScore: 65,
        counsellorId: users['counsellor2@arkanya.in'].id,
        notes: 'Needs guidance on scholarship criteria. Scheduled for a video counselling session.',
      },
      {
        tenantId: tenant.id,
        name: 'Vikram Aditya',
        phone: '+919333444555',
        email: 'vikram.aditya@gmail.com',
        parentName: 'Kishore Aditya',
        state: 'Bihar',
        city: 'Patna',
        qualification: '12th Pass',
        marksPercentage: 68.0,
        preferredCourse: 'B.Tech IT',
        preferredCollege: 'KIIT School of Computer Engineering',
        budget: 1200000,
        source: 'WhatsApp',
        pipelineStage: 'DocPending',
        leadScore: 72,
        counsellorId: users['counsellor1@arkanya.in'].id,
        notes: 'Documents verification in progress. Class 12th marksheet pending.',
      },
      {
        tenantId: tenant.id,
        name: 'Priya Nair',
        phone: '+919444555666',
        email: 'priya.nair@hotmail.com',
        parentName: 'Gopakumar Nair',
        state: 'Kerala',
        city: 'Kochi',
        qualification: '12th Pass',
        marksPercentage: 94.8,
        preferredCourse: 'B.Tech CSE',
        preferredCollege: 'Amity School of Engineering & Technology',
        budget: 1600000,
        source: 'Google',
        pipelineStage: 'Confirmed',
        leadScore: 95,
        counsellorId: users['counsellor1@arkanya.in'].id,
        notes: 'Admission Confirmed, Fee receipt generated. High-performing student eligible for scholarship.',
      },
      {
        tenantId: tenant.id,
        name: 'Rajesh Kulkarni',
        phone: '+919555666777',
        email: 'rajesh.k@gmail.com',
        parentName: 'Nitin Kulkarni',
        state: 'Maharashtra',
        city: 'Pune',
        qualification: '12th Pass',
        marksPercentage: 58.5,
        preferredCourse: 'B.Tech ECE',
        preferredCollege: 'Amity School of Engineering & Technology',
        budget: 900000,
        source: 'Referral',
        pipelineStage: 'Lost',
        leadScore: 25,
        counsellorId: users['counsellor2@arkanya.in'].id,
        notes: 'Opted for local state government college due to budget constraints.',
      },
    ],
  });

  console.log('CRM Leads seeded.');

  // Fetch some leads for Follow-up creation
  const dbLeads = await prisma.lead.findMany({ take: 3 });

  // 8. Create FollowUps
  await prisma.followUp.createMany({
    data: [
      {
        leadId: dbLeads[0].id,
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
        type: 'Call',
        notes: 'Call Aarav to confirm college preference card submission.',
        isCompleted: false,
      },
      {
        leadId: dbLeads[1].id,
        dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // in 2 hours
        type: 'Meeting',
        notes: 'Zoom meeting with Simran & parent Harpreet to discuss MBA syllabus.',
        isCompleted: false,
      },
      {
        leadId: dbLeads[2].id,
        dateTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
        type: 'WhatsApp',
        notes: 'Sent list of documents required for verification.',
        isCompleted: true,
      },
    ],
  });

  console.log('Follow-ups seeded.');

  // 9. Create Transactions
  await prisma.transaction.createMany({
    data: [
      {
        tenantId: tenant.id,
        userId: users['student@arkanya.in'].id,
        type: 'Income',
        category: 'Registration',
        amount: 25000.0,
        gstAmount: 4500.0, // 18%
        invoiceNumber: 'INV-2026-001',
        paymentStatus: 'Completed',
        paymentMethod: 'Razorpay',
        description: 'B.Tech registration fees for student Rahul Sen',
      },
      {
        tenantId: tenant.id,
        type: 'Income',
        category: 'Commission',
        amount: 180000.0,
        gstAmount: 32400.0,
        invoiceNumber: 'INV-KIIT-A09',
        paymentStatus: 'Completed',
        paymentMethod: 'Bank Transfer',
        description: 'Referral commission for 5 students enrolled in KIIT B.Tech CSE',
      },
      {
        tenantId: tenant.id,
        type: 'Expense',
        category: 'Marketing',
        amount: 35000.0,
        gstAmount: 6300.0,
        invoiceNumber: 'EXP-FB-MARCH',
        paymentStatus: 'Completed',
        paymentMethod: 'Credit Card',
        description: 'Facebook and Instagram Ads Campaign for Spring admissions',
      },
      {
        tenantId: tenant.id,
        type: 'Expense',
        category: 'Salary',
        amount: 50000.0,
        gstAmount: 0.0,
        invoiceNumber: 'SAL-APRIL-ADITI',
        paymentStatus: 'Completed',
        paymentMethod: 'Bank Transfer',
        description: 'Salary payment for Senior Counsellor Aditi Sharma',
      },
    ],
  });

  console.log('Transactions & Ledger items seeded.');

  console.log('Database Seeding Complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding database: ', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
