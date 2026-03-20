import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding EduFlow database...");

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("Admin@123", 12);
  const userHash = await bcrypt.hash("User@123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@eduflow.com" },
    update: {},
    create: {
      email: "admin@eduflow.com",
      passwordHash: adminHash,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      phone: "+1-555-0100",
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@eduflow.com" },
    update: {},
    create: {
      email: "manager@eduflow.com",
      passwordHash: userHash,
      firstName: "Sarah",
      lastName: "Johnson",
      role: "MANAGER",
      phone: "+1-555-0101",
    },
  });

  const counselor1 = await prisma.user.upsert({
    where: { email: "john@eduflow.com" },
    update: {},
    create: {
      email: "john@eduflow.com",
      passwordHash: userHash,
      firstName: "John",
      lastName: "Smith",
      role: "COUNSELOR",
      phone: "+1-555-0102",
    },
  });

  const counselor2 = await prisma.user.upsert({
    where: { email: "priya@eduflow.com" },
    update: {},
    create: {
      email: "priya@eduflow.com",
      passwordHash: userHash,
      firstName: "Priya",
      lastName: "Sharma",
      role: "COUNSELOR",
      phone: "+1-555-0103",
    },
  });

  const receptionist = await prisma.user.upsert({
    where: { email: "reception@eduflow.com" },
    update: {},
    create: {
      email: "reception@eduflow.com",
      passwordHash: userHash,
      firstName: "Maria",
      lastName: "Lopez",
      role: "RECEPTIONIST",
      phone: "+1-555-0104",
    },
  });

  // ── Countries ──────────────────────────────────────────────────────────────
  const countries = await Promise.all([
    prisma.country.upsert({
      where: { code: "CA" },
      update: {},
      create: {
        name: "Canada",
        code: "CA",
        flagEmoji: "🇨🇦",
        currency: "CAD",
        workRights: "Up to 20 hrs/week during study; full-time during scheduled breaks",
        postStudyWork: "PGWP up to 3 years based on program length",
        healthInsuranceRequired: false,
        livingCostRange: "CAD 15,000–25,000/year",
        visaInfo: {
          processingTime: "4–8 weeks",
          fee: "CAD 150",
          type: "Study Permit",
        },
      },
    }),
    prisma.country.upsert({
      where: { code: "GB" },
      update: {},
      create: {
        name: "United Kingdom",
        code: "GB",
        flagEmoji: "🇬🇧",
        currency: "GBP",
        workRights: "Up to 20 hrs/week during term; full-time during vacations",
        postStudyWork: "Graduate Route Visa — 2 years (3 for PhD)",
        healthInsuranceRequired: true,
        livingCostRange: "GBP 12,000–20,000/year",
        visaInfo: {
          processingTime: "3 weeks",
          fee: "GBP 490",
          type: "Student Visa (Tier 4)",
        },
      },
    }),
    prisma.country.upsert({
      where: { code: "AU" },
      update: {},
      create: {
        name: "Australia",
        code: "AU",
        flagEmoji: "🇦🇺",
        currency: "AUD",
        workRights: "48 hrs/fortnight during study; unlimited during vacations",
        postStudyWork: "Temporary Graduate Visa — 2–4 years",
        healthInsuranceRequired: true,
        livingCostRange: "AUD 20,000–30,000/year",
        visaInfo: {
          processingTime: "4–6 weeks",
          fee: "AUD 710",
          type: "Student Visa (Subclass 500)",
        },
      },
    }),
    prisma.country.upsert({
      where: { code: "US" },
      update: {},
      create: {
        name: "United States",
        code: "US",
        flagEmoji: "🇺🇸",
        currency: "USD",
        workRights: "On-campus only during study; OPT/CPT with authorization",
        postStudyWork: "OPT — 12 months (36 months for STEM)",
        healthInsuranceRequired: false,
        livingCostRange: "USD 15,000–30,000/year",
        visaInfo: {
          processingTime: "2–8 weeks",
          fee: "USD 160",
          type: "F-1 Student Visa",
        },
      },
    }),
    prisma.country.upsert({
      where: { code: "DE" },
      update: {},
      create: {
        name: "Germany",
        code: "DE",
        flagEmoji: "🇩🇪",
        currency: "EUR",
        workRights: "Up to 120 full or 240 half days per year",
        postStudyWork: "18-month job-seeker visa after graduation",
        healthInsuranceRequired: true,
        livingCostRange: "EUR 10,000–15,000/year",
        visaInfo: {
          processingTime: "4–8 weeks",
          fee: "EUR 75",
          type: "Student Visa (National Visa D)",
        },
      },
    }),
    prisma.country.upsert({
      where: { code: "NZ" },
      update: {},
      create: {
        name: "New Zealand",
        code: "NZ",
        flagEmoji: "🇳🇿",
        currency: "NZD",
        workRights: "Up to 20 hrs/week during study; full-time during holidays",
        postStudyWork: "Post-Study Work Visa — up to 3 years",
        healthInsuranceRequired: false,
        livingCostRange: "NZD 15,000–25,000/year",
        visaInfo: {
          processingTime: "2–4 weeks",
          fee: "NZD 375",
          type: "Student Visa",
        },
      },
    }),
  ]);

  const [canada, uk, australia, usa] = countries;

  // ── Country Requirements ───────────────────────────────────────────────────
  const commonDocs = [
    "PASSPORT",
    "PASSPORT_PHOTO",
    "ACADEMIC_TRANSCRIPT_HIGHER_SECONDARY",
    "ACADEMIC_TRANSCRIPT_BACHELORS",
    "DEGREE_CERTIFICATE",
    "CV_RESUME",
    "SOP",
    "LOR_1",
    "LOR_2",
    "BANK_STATEMENT",
  ] as const;

  for (const country of [canada, uk, australia, usa]) {
    for (const docType of commonDocs) {
      await prisma.countryRequirement.upsert({
        where: { countryId_documentType: { countryId: country.id, documentType: docType } },
        update: {},
        create: { countryId: country.id, documentType: docType, isMandatory: true },
      });
    }
  }

  // Canada specific
  await prisma.countryRequirement.upsert({
    where: { countryId_documentType: { countryId: canada.id, documentType: "IELTS_SCORECARD" } },
    update: {},
    create: { countryId: canada.id, documentType: "IELTS_SCORECARD", isMandatory: true },
  });

  // UK specific
  await prisma.countryRequirement.upsert({
    where: { countryId_documentType: { countryId: uk.id, documentType: "IELTS_SCORECARD" } },
    update: {},
    create: { countryId: uk.id, documentType: "IELTS_SCORECARD", isMandatory: true },
  });

  // ── Universities ───────────────────────────────────────────────────────────
  const ubc = await prisma.university.upsert({
    where: { id: "uni-ubc" },
    update: {},
    create: {
      id: "uni-ubc",
      countryId: canada.id,
      name: "University of British Columbia",
      shortName: "UBC",
      city: "Vancouver",
      state: "British Columbia",
      type: "PUBLIC",
      website: "https://www.ubc.ca",
      rankingGlobal: 46,
      rankingNational: 3,
      isPartner: true,
      commissionRate: 10,
    },
  });

  const toronto = await prisma.university.upsert({
    where: { id: "uni-toronto" },
    update: {},
    create: {
      id: "uni-toronto",
      countryId: canada.id,
      name: "University of Toronto",
      shortName: "UofT",
      city: "Toronto",
      state: "Ontario",
      type: "PUBLIC",
      rankingGlobal: 25,
      rankingNational: 1,
      isPartner: true,
      commissionRate: 10,
    },
  });

  const ucl = await prisma.university.upsert({
    where: { id: "uni-ucl" },
    update: {},
    create: {
      id: "uni-ucl",
      countryId: uk.id,
      name: "University College London",
      shortName: "UCL",
      city: "London",
      type: "PUBLIC",
      rankingGlobal: 9,
      rankingNational: 4,
      isPartner: true,
      commissionRate: 12,
    },
  });

  const unimelb = await prisma.university.upsert({
    where: { id: "uni-unimelb" },
    update: {},
    create: {
      id: "uni-unimelb",
      countryId: australia.id,
      name: "University of Melbourne",
      shortName: "UniMelb",
      city: "Melbourne",
      state: "Victoria",
      type: "PUBLIC",
      rankingGlobal: 33,
      rankingNational: 1,
      isPartner: true,
      commissionRate: 11,
    },
  });

  // ── Intakes ────────────────────────────────────────────────────────────────
  const fall2026 = await prisma.intake.upsert({
    where: { id: "intake-ca-fall-2026" },
    update: {},
    create: {
      id: "intake-ca-fall-2026",
      countryId: canada.id,
      name: "Fall 2026",
      startDate: new Date("2026-09-01"),
      applicationDeadline: new Date("2026-04-01"),
    },
  });

  const jan2027 = await prisma.intake.upsert({
    where: { id: "intake-ca-jan-2027" },
    update: {},
    create: {
      id: "intake-ca-jan-2027",
      countryId: canada.id,
      name: "January 2027",
      startDate: new Date("2027-01-10"),
      applicationDeadline: new Date("2026-10-01"),
    },
  });

  const sep2026uk = await prisma.intake.upsert({
    where: { id: "intake-gb-sep-2026" },
    update: {},
    create: {
      id: "intake-gb-sep-2026",
      countryId: uk.id,
      name: "September 2026",
      startDate: new Date("2026-09-20"),
      applicationDeadline: new Date("2026-05-31"),
    },
  });

  // ── Programs ───────────────────────────────────────────────────────────────
  const mcs = await prisma.program.upsert({
    where: { id: "prog-ubc-mcs" },
    update: {},
    create: {
      id: "prog-ubc-mcs",
      universityId: ubc.id,
      name: "Master of Computer Science",
      level: "MASTERS",
      field: "Computer Science",
      durationMonths: 24,
      tuitionFee: 18000,
      feeCurrency: "CAD",
      applicationFee: 180,
      scholarshipAvailable: true,
      scholarshipDetails: "Merit-based scholarships available for international students",
    },
  });

  await prisma.programRequirement.upsert({
    where: { id: "req-mcs-ielts" },
    update: {},
    create: {
      id: "req-mcs-ielts",
      programId: mcs.id,
      requirementType: "IELTS_OVERALL",
      minValue: "6.5",
      isMandatory: true,
      description: "Minimum 6.0 in each band",
    },
  });

  await prisma.programRequirement.upsert({
    where: { id: "req-mcs-gpa" },
    update: {},
    create: {
      id: "req-mcs-gpa",
      programId: mcs.id,
      requirementType: "GPA_MINIMUM",
      minValue: "3.0",
      isMandatory: true,
      description: "Minimum GPA on a 4.0 scale",
    },
  });

  const mba = await prisma.program.upsert({
    where: { id: "prog-toronto-mba" },
    update: {},
    create: {
      id: "prog-toronto-mba",
      universityId: toronto.id,
      name: "Master of Business Administration",
      level: "MASTERS",
      field: "Business Administration",
      durationMonths: 20,
      tuitionFee: 90000,
      feeCurrency: "CAD",
      applicationFee: 200,
    },
  });

  const lawucl = await prisma.program.upsert({
    where: { id: "prog-ucl-llm" },
    update: {},
    create: {
      id: "prog-ucl-llm",
      universityId: ucl.id,
      name: "LLM International Law",
      level: "MASTERS",
      field: "Law",
      durationMonths: 12,
      tuitionFee: 28000,
      feeCurrency: "GBP",
      applicationFee: 0,
    },
  });

  // ── Sample Students ────────────────────────────────────────────────────────
  const student1 = await prisma.student.upsert({
    where: { referenceNumber: "STU-2026-00001" },
    update: {},
    create: {
      referenceNumber: "STU-2026-00001",
      firstName: "Ahmed",
      lastName: "Khan",
      email: "ahmed.khan@email.com",
      phonePrimary: "+91-9876543210",
      whatsappNumber: "+91-9876543210",
      dateOfBirth: new Date("1999-03-15"),
      gender: "MALE",
      nationality: "Indian",
      maritalStatus: "SINGLE",
      currentCity: "Mumbai",
      currentState: "Maharashtra",
      currentCountry: "India",
      passportNumber: "J1234567",
      passportExpiryDate: new Date("2030-06-15"),
      preferredCountries: ["CA", "GB"],
      preferredLevel: "MASTERS",
      preferredField: "Computer Science",
      preferredIntake: "Fall 2026",
      budgetMin: 15000,
      budgetMax: 25000,
      budgetCurrency: "USD",
      fundingSource: "FAMILY",
      annualFamilyIncome: 75000,
      incomeCurrency: "USD",
      bankBalance: 45000,
      stage: "VISA_APPLIED",
      priority: "HIGH",
      source: "REFERRAL",
      assignedCounselorId: counselor1.id,
      createdById: admin.id,
      tags: ["visa-applied", "canada"],
    },
  });

  await prisma.academicRecord.createMany({
    skipDuplicates: true,
    data: [
      {
        studentId: student1.id,
        level: "HIGHER_SECONDARY",
        institution: "St. Xavier's College",
        boardUniversity: "CBSE",
        country: "India",
        gradeType: "PERCENTAGE",
        gradeValue: "88",
        maxGrade: "100",
        isCompleted: true,
        backlogs: 0,
      },
      {
        studentId: student1.id,
        level: "BACHELORS",
        institution: "IIT Bombay",
        boardUniversity: "IIT Bombay",
        country: "India",
        fieldOfStudy: "Computer Engineering",
        gradeType: "CGPA",
        gradeValue: "8.7",
        maxGrade: "10.0",
        isCompleted: true,
        backlogs: 0,
        mediumOfInstruction: "English",
      },
    ],
  });

  await prisma.testScore.create({
    data: {
      studentId: student1.id,
      testType: "IELTS",
      overallScore: "7.5",
      subScores: { listening: 8.0, reading: 7.5, writing: 7.0, speaking: 7.5 },
      testDate: new Date("2025-11-10"),
      expiryDate: new Date("2027-11-10"),
      isVerified: true,
    },
  });

  await prisma.communicationLog.create({
    data: {
      studentId: student1.id,
      type: "PHONE_CALL",
      direction: "OUTBOUND",
      subject: "Visa application update",
      summary: "Discussed visa timeline. Ahmed confirmed biometrics done. Awaiting decision.",
      durationMinutes: 15,
      outcome: "CONNECTED",
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      loggedById: counselor1.id,
    },
  });

  // Student 2
  const student2 = await prisma.student.upsert({
    where: { referenceNumber: "STU-2026-00002" },
    update: {},
    create: {
      referenceNumber: "STU-2026-00002",
      firstName: "Priya",
      lastName: "Singh",
      email: "priya.singh@email.com",
      phonePrimary: "+91-8765432109",
      dateOfBirth: new Date("2001-07-22"),
      gender: "FEMALE",
      nationality: "Indian",
      currentCity: "Delhi",
      currentCountry: "India",
      preferredCountries: ["GB", "AU"],
      preferredLevel: "MASTERS",
      preferredField: "Business",
      fundingSource: "LOAN",
      stage: "OFFER_RECEIVED",
      priority: "MEDIUM",
      source: "WEBSITE",
      assignedCounselorId: counselor2.id,
      createdById: counselor2.id,
    },
  });

  // Student 3
  await prisma.student.upsert({
    where: { referenceNumber: "STU-2026-00003" },
    update: {},
    create: {
      referenceNumber: "STU-2026-00003",
      firstName: "Wei",
      lastName: "Liu",
      email: "wei.liu@email.com",
      phonePrimary: "+86-13800138000",
      dateOfBirth: new Date("2000-02-10"),
      gender: "MALE",
      nationality: "Chinese",
      currentCity: "Beijing",
      currentCountry: "China",
      preferredCountries: ["US", "CA"],
      preferredLevel: "MASTERS",
      preferredField: "Engineering",
      fundingSource: "FAMILY",
      stage: "APPLICATIONS_SUBMITTED",
      priority: "HIGH",
      source: "AGENT",
      assignedCounselorId: counselor1.id,
      createdById: admin.id,
    },
  });

  // Student 4
  await prisma.student.upsert({
    where: { referenceNumber: "STU-2026-00004" },
    update: {},
    create: {
      referenceNumber: "STU-2026-00004",
      firstName: "Riya",
      lastName: "Mehta",
      email: "riya.mehta@email.com",
      phonePrimary: "+91-7654321098",
      dateOfBirth: new Date("2002-11-05"),
      gender: "FEMALE",
      nationality: "Indian",
      currentCity: "Ahmedabad",
      currentCountry: "India",
      preferredCountries: ["AU", "NZ"],
      preferredLevel: "BACHELORS",
      preferredField: "Nursing",
      fundingSource: "FAMILY",
      stage: "DOCUMENTS_COLLECTION",
      priority: "MEDIUM",
      source: "WALK_IN",
      assignedCounselorId: counselor2.id,
      createdById: receptionist.id,
    },
  });

  // Student 5
  await prisma.student.upsert({
    where: { referenceNumber: "STU-2026-00005" },
    update: {},
    create: {
      referenceNumber: "STU-2026-00005",
      firstName: "Sam",
      lastName: "Thomas",
      email: "sam.thomas@email.com",
      phonePrimary: "+91-6543210987",
      dateOfBirth: new Date("1998-09-18"),
      gender: "MALE",
      nationality: "Indian",
      currentCity: "Kochi",
      currentCountry: "India",
      preferredCountries: ["DE", "NL"],
      preferredLevel: "MASTERS",
      preferredField: "Data Science",
      fundingSource: "SCHOLARSHIP",
      stage: "NEW_INQUIRY",
      priority: "LOW",
      source: "SOCIAL_MEDIA",
      createdById: receptionist.id,
    },
  });

  // ── Application ────────────────────────────────────────────────────────────
  await prisma.application.upsert({
    where: { applicationNumber: "APP-2026-00001" },
    update: {},
    create: {
      applicationNumber: "APP-2026-00001",
      studentId: student1.id,
      programId: mcs.id,
      intakeId: fall2026.id,
      status: "VISA_APPLIED",
      submissionDate: new Date("2025-12-15"),
      offerDate: new Date("2026-01-20"),
      offerDeadline: new Date("2026-04-15"),
      depositPaid: true,
      depositAmount: 5000,
      depositDate: new Date("2026-02-01"),
      universityRef: "UBC-2026-AMK",
      assignedToId: counselor1.id,
    },
  });

  // ── Tasks ──────────────────────────────────────────────────────────────────
  await prisma.task.createMany({
    skipDuplicates: true,
    data: [
      {
        title: "Follow up on Ahmed's visa decision",
        studentId: student1.id,
        assignedToId: counselor1.id,
        assignedById: manager.id,
        priority: "HIGH",
        status: "PENDING",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Review Priya's offer letter",
        studentId: student2.id,
        assignedToId: counselor2.id,
        assignedById: manager.id,
        priority: "MEDIUM",
        status: "PENDING",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Send document checklist to Riya",
        studentId: student2.id,
        assignedToId: counselor2.id,
        assignedById: manager.id,
        priority: "MEDIUM",
        status: "PENDING",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // ── Activity Logs ──────────────────────────────────────────────────────────
  await prisma.activityLog.createMany({
    skipDuplicates: true,
    data: [
      {
        entityType: "Student",
        entityId: student1.id,
        action: "STAGE_CHANGED",
        changes: { from: "VISA_DOCUMENTS_PREP", to: "VISA_APPLIED" },
        performedById: counselor1.id,
      },
      {
        entityType: "Student",
        entityId: student2.id,
        action: "STAGE_CHANGED",
        changes: { from: "APPLICATIONS_SUBMITTED", to: "OFFER_RECEIVED" },
        performedById: counselor2.id,
      },
      {
        entityType: "Application",
        entityId: "APP-2026-00001",
        action: "CREATED",
        changes: {},
        performedById: counselor1.id,
      },
    ],
  });

  console.log("✅ Seed complete!");
  console.log("\n📋 Demo Accounts:");
  console.log("   Admin:        admin@eduflow.com / Admin@123");
  console.log("   Manager:      manager@eduflow.com / User@123");
  console.log("   Counselor:    john@eduflow.com / User@123");
  console.log("   Counselor:    priya@eduflow.com / User@123");
  console.log("   Receptionist: reception@eduflow.com / User@123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
