import crypto from 'node:crypto'

const now = new Date()
const iso = (date) => date.toISOString()
const day = (offset) => {
  const date = new Date(now)
  date.setUTCHours(4, 0, 0, 0)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}
const id = () => crypto.randomUUID()

const facility = (key, nameBn, nameEn) => ({
  id: id(),
  key,
  nameBn,
  nameEn,
  detailBn: 'তথ্য হালনাগাদ করা হচ্ছে',
  detailEn: 'Information is being updated',
  verified: false,
})

export function createSeedData() {
  const session2025 = id()
  const session2026 = id()
  const hsc = id()
  const degree = id()

  return {
    meta: {
      schemaVersion: 1,
      createdAt: iso(now),
      seededAt: iso(now),
      demoContentNotice:
        'নমুনা হিসেবে চিহ্নিত নোটিশ ও ইভেন্টগুলো কেবল ওয়েবসাইটের কার্যকারিতা প্রদর্শনের জন্য যোগ করা হয়েছে। এগুলো অফিসিয়াল কলেজ তথ্য নয়।',
    },
    settings: {
      institution: {
        nameBn: 'কোলা আদর্শ ডিগ্রি কলেজ',
        nameEn: 'Kola Adarsha Degree College',
        eiin: '123139',
        establishedDate: '1995-01-21',
        establishedVerified: false,
        addressBn: 'কোলা, বাদলগাছী, নওগাঁ, রাজশাহী বিভাগ, বাংলাদেশ',
        addressEn: 'Kola, Badalgachhi, Naogaon, Rajshahi Division, Bangladesh',
        upazila: 'বাদলগাছী',
        district: 'নওগাঁ',
        division: 'রাজশাহী',
        postCode: '',
        typeBn: 'উচ্চ-মাধ্যমিক ও ডিগ্রি পর্যায়ের শিক্ষাপ্রতিষ্ঠান (যাচাই প্রক্রিয়াধীন)',
        typeEn: 'Higher-secondary and degree-level institution (verification pending)',
        educationLevels: [
          {
            nameBn: 'উচ্চ মাধ্যমিক সার্টিফিকেট (এইচএসসি)',
            nameEn: 'Higher Secondary Certificate (HSC)',
            verified: false,
          },
          {
            nameBn: 'ডিগ্রি (পাস) কোর্স',
            nameEn: 'Degree (Pass) programme',
            verified: false,
          },
        ],
        groups: [
          { nameBn: 'বিজ্ঞান', nameEn: 'Science', verified: false },
          { nameBn: 'মানবিক', nameEn: 'Humanities', verified: false },
          { nameBn: 'ব্যবসায় শিক্ষা', nameEn: 'Business Studies', verified: false },
        ],
        affiliationBn: 'যাচাই প্রক্রিয়াধীন',
        recognitionBn: 'যাচাই প্রক্রিয়াধীন',
        phone: '',
        email: '',
        website: '',
        officeHoursBn: '',
        officeHoursEn: '',
        mapVerified: false,
      },
      content: {
        taglineBn: 'জ্ঞান, নৈতিকতা ও সম্ভাবনার পথে এগিয়ে চলা',
        taglineEn: 'Advancing through knowledge, integrity and opportunity',
        welcomeTitleBn: 'কলেজ পরিবারের পক্ষ থেকে স্বাগতম',
        welcomeTitleEn: 'Welcome from the college family',
        welcomeBn:
          'কোলা আদর্শ ডিগ্রি কলেজের অনলাইন তথ্যকেন্দ্রে আপনাকে স্বাগতম। শিক্ষার্থী, অভিভাবক, শিক্ষক ও প্রয়োগকারীদের জন্য প্রয়োজনীয় একাডেমিক তথ্য, নোটিশ, ফলাফল ও যোগাযোগের ব্যবস্থা এক জায়গায় সাজানো হয়েছে। আমাদের লক্ষ্য হলো নির্ভুল, সময়োপযোগী ও সহজলভ্য তথ্যের মাধ্যমে শিক্ষার পরিবেশকে আরও শক্তিশালী করা।',
        welcomeEn:
          'Welcome to the online information centre of Kola Adarsha Degree College. Academic information, notices, results and contact channels for students, guardians, teachers and applicants are gathered in one place. Our aim is to strengthen learning through accurate, timely and accessible information.',
        aboutIntroBn:
          'কোলা আদর্শ ডিগ্রি কলেজ নওগাঁ জেলার বাদলগাছী উপজেলার কোলা এলাকায় অবস্থিত একটি শিক্ষাপ্রতিষ্ঠান। প্রতিষ্ঠানটি উচ্চ-মাধ্যমিক ও ডিগ্রি পর্যায়ের শিক্ষা প্রদান করে বলে প্রাপ্ত তথ্যে উল্লেখ রয়েছে; শিক্ষা কার্যক্রম ও অনুমোদনের সর্বশেষ অবস্থা অফিসিয়াল সূত্রে যাচাই করা হচ্ছে।',
        aboutIntroEn:
          'Kola Adarsha Degree College is an educational institution located at Kola in the Badalgachhi upazila of Naogaon district. Available information indicates that it offers higher-secondary and degree-level education; the current programme status and official approvals are under verification.',
        historyBn:
          'কোলা আদর্শ ডিগ্রি কলেজ ১৯৯৫ সালের ২১ জানুয়ারি প্রতিষ্ঠিত বলে প্রাপ্ত তথ্যে উল্লেখ রয়েছে। প্রতিষ্ঠার সঠিক তারিখ, প্রতিষ্ঠাতা সদস্য এবং গুরুত্বপূর্ণ মাইলফলক অফিসিয়াল নথির মাধ্যমে যাচাই করা হচ্ছে। যাচাই সম্পন্ন না হওয়া পর্যন্ত অনুমানভিত্তিক কোনো তথ্য এখানে প্রকাশ করা হচ্ছে না।',
        historyEn:
          'Available information states that Kola Adarsha Degree College was established on 21 January 1995. The exact founding date, founding members and key milestones are being verified against official records. No assumptions are published while that verification is pending.',
        missionBn:
          'এই প্রতিষ্ঠানের মিশন বিবৃতি কলেজ কর্তৃপক্ষের অনুমোদনের অপেক্ষায় রয়েছে। অনুমোদিত বিবৃতি পাওয়ার পর এখানে প্রকাশ করা হবে।',
        missionEn:
          'The mission statement of this institution is awaiting approval from the college authority. The approved statement will be published here.',
        visionBn:
          'এই প্রতিষ্ঠানের ভিশন বিবৃতি কলেজ কর্তৃপক্ষের অনুমোদনের অপেক্ষায় রয়েছে। অনুমোদিত বিবৃতি পাওয়ার পর এখানে প্রকাশ করা হবে।',
        visionEn:
          'The vision statement of this institution is awaiting approval from the college authority. The approved statement will be published here.',
        principalNameBn: '',
        principalNameEn: '',
        principalDesignationBn: '',
        principalDesignationEn: '',
        principalMessageBn:
          'প্রিন্সিপালের নাম, পদবি, স্বাক্ষর ও বার্তা অফিসিয়াল যাচাই ও অনুমোদনের পর এখানে প্রকাশ করা হবে।',
        principalMessageEn:
          "The Principal's name, designation, signature and message will be published after official verification and approval.",
        objectives: [
          {
            bn: 'একাডেমিক উৎকর্ষ ও নিয়মিত পাঠদানের মাধ্যমে শিক্ষার্থীর সর্বোচ্চ সম্ভাবনা বিকাশ করা।',
            en: 'Developing every learner’s potential through academic excellence and regular teaching.',
          },
          {
            bn: 'নৈতিক মূল্যবোধ, সততা ও দায়িত্বশীল নাগরিকত্ব গড়ে তোলা।',
            en: 'Building ethical values, integrity and responsible citizenship.',
          },
          {
            bn: 'শিক্ষার্থীর ব্যক্তিগত, সামাজিক ও সৃজনশীল উন্নয়নে সহায়তা করা।',
            en: 'Supporting students’ personal, social and creative development.',
          },
          {
            bn: 'সবার জন্য সমান শিক্ষার সুযোগ নিশ্চিত করা।',
            en: 'Ensuring equal access to education for all.',
          },
          {
            bn: 'একাডেমিক তথ্য, নোটিশ ও ফলাফল ডিজিটাল মাধ্যমে সহজলভ্য করা।',
            en: 'Making academic information, notices and results easy to access digitally.',
          },
        ],
        facilities: [
          facility('classroom', 'শ্রেণিকক্ষ', 'Classrooms'),
          facility('library', 'গ্রন্থাগার', 'Library'),
          facility('laboratory', 'বিজ্ঞানাগার', 'Science laboratories'),
          facility('computer', 'কম্পিউটার সুবিধা', 'Computer facilities'),
          facility('common-room', 'কমন রুম', 'Common rooms'),
          facility('sanitation', 'শৌচাগার ও স্যানিটেশন', 'Sanitation'),
          facility('playground', 'খেলার মাঠ', 'Playground'),
        ],
        achievements: [],
      },
      admission: {
        introBn:
          'ভর্তি সংক্রান্ত অফিসিয়াল বিজ্ঞপ্তি প্রকাশিত হলে এই পেজে বিস্তারিত তথ্য, সময়সূচি ও আবেদনের নির্দেশনা যুক্ত করা হবে।',
        introEn:
          'When an official admission announcement is published, details, deadlines and application instructions will be added to this page.',
        eligibilityBn: 'যাচাই প্রক্রিয়াধীন — অফিসিয়াল ভর্তি বিজ্ঞপ্তির মাধ্যমে নিশ্চিত করা হবে।',
        eligibilityEn: 'Verification pending — confirmed through the official admission announcement.',
        documentsBn: 'যাচাই প্রক্রিয়াধীন — প্রয়োজনীয় কাগজপত্রের তালিকা অফিসিয়াল বিজ্ঞপ্তিতে প্রকাশ করা হবে।',
        documentsEn: 'Verification pending — the required document list will be published officially.',
        stepsBn:
          'অফিসিয়াল ভর্তি বিজ্ঞপ্তি প্রকাশের পর আবেদন প্রক্রিয়া ধাপে ধাপে এখানে জানানো হবে। কোনো অনানুষ্ঠানিক মাধ্যম থেকে তথ্য সংগ্রহ করবেন না।',
        stepsEn:
          'The application process will be published step by step after an official admission announcement. Please do not rely on unofficial sources.',
        feesBn: 'যাচাই প্রক্রিয়াধীন — অনুমোদিত ফি অফিসিয়াল বিজ্ঞপ্তিতে প্রকাশ করা হবে।',
        feesEn: 'Verification pending — approved fees will be published officially.',
        deadlineBn: '',
        applyUrl: '',
        faqs: [
          {
            id: id(),
            qBn: 'ভর্তি বিজ্ঞপ্তি কোথায় পাব?',
            aBn: 'প্রকাশিত হলে ওয়েবসাইটের নোটিশ এবং ভর্তি পেজে দেখা যাবে। অফিসিয়াল বিজ্ঞপ্তি ছাড়া কোনো তথ্য প্রকাশ করা হয় না।',
            qEn: 'Where can I find the admission notice?',
            aEn: 'Once published, it will appear on the notices and admission pages. No admission information is published without an official notice.',
          },
          {
            id: id(),
            qBn: 'ফলাফল কীভাবে দেখব?',
            aBn: 'ফলাফল পেজে পরীক্ষা, রোল নম্বর ও রেজিস্ট্রেশন নম্বর দিয়ে প্রকাশিত ফলাফল দেখা যাবে।',
            qEn: 'How do I check my result?',
            aEn: 'Use the Results page with the examination, roll number and registration number to view published results.',
          },
          {
            id: id(),
            qBn: 'শিক্ষার্থী অ্যাকাউন্ট কীভাবে পাব?',
            aBn: 'কলেজ প্রশাসন শিক্ষার্থী রেকর্ডের সাথে সংযুক্ত অ্যাকাউন্ট তৈরি করে দেয়। নিজে নিজে অ্যাকাউন্ট তৈরি বা অ্যাডমিন হওয়ার কোনো সুযোগ নেই।',
            qEn: 'How do I get a student account?',
            aEn: 'College administrators create accounts linked to student records. There is no self-registration or self-promotion to administrator.',
          },
          {
            id: id(),
            qBn: 'তথ্য ভুল বা পুরোনো মনে হলে কী করব?',
            aBn: 'যোগাযোগ পেজের ফর্মের মাধ্যমে কলেজ প্রশাসনকে জানান। যাচাই করে প্রয়োজনীয় সংশোধন করা হবে।',
            qEn: 'What should I do if information looks incorrect or outdated?',
            aEn: 'Notify the college administration through the contact form. The information will be verified and corrected as needed.',
          },
        ],
      },
      updatedAt: iso(now),
    },
    users: [],
    sessions: [],
    resetTokens: [],
    teachers: [],
    students: [],
    academicSessions: [
      { id: session2025, name: '২০২৫-২০২৬', startDate: '2025-07-01', endDate: '2026-06-30', status: 'active', createdAt: iso(now), updatedAt: iso(now) },
      { id: session2026, name: '২০২৬-২০২৭', startDate: '2026-07-01', endDate: '2027-06-30', status: 'active', createdAt: iso(now), updatedAt: iso(now) },
    ],
    programs: [
      {
        id: hsc,
        nameBn: 'উচ্চ মাধ্যমিক (এইচএসসি)',
        nameEn: 'Higher Secondary Certificate (HSC)',
        level: 'HSC',
        groups: ['বিজ্ঞান', 'মানবিক', 'ব্যবসায় শিক্ষা'],
        status: 'active',
        verified: false,
        createdAt: iso(now),
        updatedAt: iso(now),
      },
      {
        id: degree,
        nameBn: 'ডিগ্রি (পাস)',
        nameEn: 'Degree (Pass)',
        level: 'DEGREE',
        groups: ['বিজ্ঞান', 'মানবিক', 'ব্যবসায় শিক্ষা'],
        status: 'active',
        verified: false,
        createdAt: iso(now),
        updatedAt: iso(now),
      },
    ],
    subjects: [
      { id: id(), code: 'BAN', nameBn: 'বাংলা', nameEn: 'Bangla', programId: hsc, group: '', status: 'active' },
      { id: id(), code: 'ENG', nameBn: 'ইংরেজি', nameEn: 'English', programId: hsc, group: '', status: 'active' },
      { id: id(), code: 'ICT', nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি', nameEn: 'ICT', programId: hsc, group: '', status: 'active' },
      { id: id(), code: 'PHY', nameBn: 'পদার্থবিজ্ঞান', nameEn: 'Physics', programId: hsc, group: 'বিজ্ঞান', status: 'active' },
      { id: id(), code: 'CHE', nameBn: 'রসায়ন', nameEn: 'Chemistry', programId: hsc, group: 'বিজ্ঞান', status: 'active' },
      { id: id(), code: 'BIO', nameBn: 'জীববিজ্ঞান', nameEn: 'Biology', programId: hsc, group: 'বিজ্ঞান', status: 'active' },
      { id: id(), code: 'MAT', nameBn: 'উচ্চতর গণিত', nameEn: 'Higher Mathematics', programId: hsc, group: 'বিজ্ঞান', status: 'active' },
      { id: id(), code: 'ACC', nameBn: 'হিসাববিজ্ঞান', nameEn: 'Accounting', programId: hsc, group: 'ব্যবসায় শিক্ষা', status: 'active' },
      { id: id(), code: 'MGT', nameBn: 'ব্যবস্থাপনা', nameEn: 'Management', programId: hsc, group: 'ব্যবসায় শিক্ষা', status: 'active' },
      { id: id(), code: 'FIN', nameBn: 'ফিন্যান্স ও ব্যাংকিং', nameEn: 'Finance and Banking', programId: hsc, group: 'ব্যবসায় শিক্ষা', status: 'active' },
      { id: id(), code: 'CIV', nameBn: 'পৌরনীতি ও সুশাসন', nameEn: 'Civics and Good Governance', programId: hsc, group: 'মানবিক', status: 'active' },
      { id: id(), code: 'HIS', nameBn: 'ইসলামের ইতিহাস', nameEn: 'Islamic History', programId: hsc, group: 'মানবিক', status: 'active' },
      { id: id(), code: 'ECO', nameBn: 'অর্থনীতি', nameEn: 'Economics', programId: hsc, group: 'মানবিক', status: 'active' },
    ],
    routines: [],
    examinations: [],
    results: [],
    notices: [
      {
        id: id(),
        title: 'নমুনা: ২০২৬-২০২৭ শিক্ষাবর্ষের ভর্তি সংক্রান্ত তথ্য শীঘ্রই প্রকাশিত হবে',
        category: 'ভর্তি',
        summary: 'এটি একটি নমুনা নোটিশ। অফিসিয়াল ভর্তি বিজ্ঞপ্তি প্রকাশিত হলে এখানে যুক্ত করা হবে।',
        body:
          'এটি ওয়েবসাইটের কার্যকারিতা প্রদর্শনের জন্য যোগ করা একটি নমুনা নোটিশ।\n\nঅফিসিয়াল ভর্তি বিজ্ঞপ্তি প্রকাশিত হলে প্রশাসনিক ড্যাশবোর্ড থেকে প্রকৃত তথ্য, সময়সূচি ও নির্দেশনা যুক্ত করা হবে। অফিসিয়াল সূত্র ছাড়া ভর্তি সংক্রান্ত কোনো তথ্য বিশ্বাস করবেন না।',
        publishedAt: iso(new Date(now.getTime() - 2 * 86400000)),
        deadline: '',
        status: 'published',
        pinned: true,
        audience: 'all',
        sessionId: '',
        attachmentUrl: '',
        isDemo: true,
        createdAt: iso(now),
        updatedAt: iso(now),
      },
      {
        id: id(),
        title: 'নমুনা: একাডেমিক ক্যালেন্ডার হালনাগাদ প্রক্রিয়াধীন',
        category: 'একাডেমিক',
        summary: 'এটি একটি নমুনা নোটিশ। অনুমোদিত একাডেমিক ক্যালেন্ডার প্রকাশিত হলে বিস্তারিত জানানো হবে।',
        body:
          'এটি একটি নমুনা নোটিশ। অনুমোদিত একাডেমিক ক্যালেন্ডার প্রকাশিত হলে পরীক্ষা, ছুটি ও ক্লাস শুরুর তারিখসহ বিস্তারিত তথ্য একাডেমিক পেজে যুক্ত করা হবে।',
        publishedAt: iso(new Date(now.getTime() - 5 * 86400000)),
        deadline: '',
        status: 'published',
        pinned: false,
        audience: 'all',
        sessionId: '',
        attachmentUrl: '',
        isDemo: true,
        createdAt: iso(now),
        updatedAt: iso(now),
      },
      {
        id: id(),
        title: 'নমুনা: কলেজের অনলাইন তথ্যকেন্দ্র চালু হয়েছে',
        category: 'সাধারণ',
        summary: 'এটি একটি নমুনা নোটিশ। ওয়েবসাইটের তথ্য ধীরে ধীরে যাচাই করে হালনাগাদ করা হবে।',
        body:
          'এটি একটি নমুনা নোটিশ। ওয়েবসাইটে প্রকাশিত প্রতিষ্ঠানসংক্রান্ত তথ্য যাচাই করে হালনাগাদ করা হবে। কোনো তথ্য ভুল বা পুরোনো মনে হলে যোগাযোগ ফর্মের মাধ্যমে জানান।',
        publishedAt: iso(new Date(now.getTime() - 9 * 86400000)),
        deadline: '',
        status: 'published',
        pinned: false,
        audience: 'all',
        sessionId: '',
        attachmentUrl: '',
        isDemo: true,
        createdAt: iso(now),
        updatedAt: iso(now),
      },
    ],
    events: [
      {
        id: id(),
        title: 'নমুনা: অভিভাবক সমাবেশ',
        description:
          'এটি একটি নমুনা ইভেন্ট। প্রকৃত তারিখ, সময় ও স্থান অনুমোদনের পর প্রশাসনিক ড্যাশবোর্ড থেকে প্রকাশ করা হবে।',
        startDate: day(14),
        endDate: '',
        startTime: '10:00',
        endTime: '12:00',
        venue: 'কলেজ ক্যাম্পাস (স্থান যাচাই প্রক্রিয়াধীন)',
        registrationInfo: '',
        status: 'published',
        isDemo: true,
        createdAt: iso(now),
        updatedAt: iso(now),
      },
      {
        id: id(),
        title: 'নমুনা: বার্ষিক ক্রীড়া অনুষ্ঠান',
        description:
          'এটি একটি নমুনা ইভেন্ট। অনুমোদিত সময়সূচি অনুযায়ী ইভেন্টের বিস্তারিত তথ্য প্রকাশ করা হবে।',
        startDate: day(35),
        endDate: '',
        startTime: '09:00',
        endTime: '16:00',
        venue: 'কলেজ খেলার মাঠ (যাচাই প্রক্রিয়াধীন)',
        registrationInfo: '',
        status: 'published',
        isDemo: true,
        createdAt: iso(now),
        updatedAt: iso(now),
      },
    ],
    calendar: [
      {
        id: id(),
        title: 'নমুনা: নতুন শিক্ষাবর্ষের ক্লাস শুরু (সম্ভাব্য)',
        date: day(20),
        endDate: '',
        type: 'academic',
        note: 'তারিখ অস্থায়ী; কর্তৃপক্ষের অনুমোদনের অপেক্ষায়।',
        provisional: true,
        status: 'published',
        isDemo: true,
        createdAt: iso(now),
        updatedAt: iso(now),
      },
      {
        id: id(),
        title: 'নমুনা: অভ্যন্তরীণ পরীক্ষা (সম্ভাব্য)',
        date: day(70),
        endDate: day(76),
        type: 'examination',
        note: 'তারিখ অস্থায়ী; অফিসিয়াল সময়সূচি প্রকাশিত হলে হালনাগাদ করা হবে।',
        provisional: true,
        status: 'published',
        isDemo: true,
        createdAt: iso(now),
        updatedAt: iso(now),
      },
    ],
    documents: [],
    contactMessages: [],
    auditLogs: [],
  }
}
