/**
 * Qaraqalpaq (Latin) — the default and only shipped locale.
 *
 * This is the single source of every piece of user-facing text in NAG'IS.
 * No component may contain a hardcoded user-visible string; if a phrase is
 * missing here, add it here first.
 *
 * Terminology is kept deliberately consistent rather than mechanically
 * translated. A short glossary of the choices made:
 *
 *   kurs          course            sabaq        lesson
 *   modul         module            oqiwshi      student
 *   oqitiwshi     instructor        dareje       level / difficulty
 *   ilgerilew     progress          jaziliw      to enrol
 *   biypul        free of charge    pulli        paid
 *   bahasi        price             som          UZS so`m
 *   sertifikat    certificate       pikir        review
 *   buyirtpa      order             tolew        payment
 *   sazlawlar     settings          izlew        search
 *   tamamlaw      to complete       qatelik      error
 *
 * Note on orthography: the Qaraqalpaq Latin alphabet uses the letters á, ǵ,
 * ń, ó, ú and ı. They are written here as real Unicode characters, so the
 * font stack in globals.css must cover Latin Extended-A.
 */

export const kaa = {
  /* ====================================================================
   * Brand & meta
   * ================================================================= */
  brand: {
    name: "NAG'IS",
    /** "naǵıs" means genuine / true — the promise behind the name. */
    tagline: 'Haqıyqıy bilim — haqıyqıy nátije',
    description:
      "NAG'IS — Qaraqaraqalpaqstanda IT kásibin qaraqalpaq tilinde úyreniw ushın onlayn platforma.",
  },

  meta: {
    homeTitle: "NAG'IS — onlayn IT bilim beriw platformasi",
    homeDescription:
      'Frontend, backend, Python, jasalma intellekt, dizayn hám basqa IT baǵdarları ' +
      'boyınsha qaraqalpaq tilindegi kurslar.',
    coursesTitle: 'Kurslar',
    coursesDescription: 'Barlıq IT kursları: baǵdar, dáreje hám baha boyınsha saylań.',
    aboutTitle: 'Biz haqqımızda',
    loginTitle: 'Kiriw',
    registerTitle: 'Dizimnen ótiw',
    dashboardTitle: 'Jeke kabinet',
    adminTitle: 'Administrator paneli',
  },

  /* ====================================================================
   * Shared / common
   * ================================================================= */
  common: {
    loading: 'Juklenip atır...',
    loadingShort: 'Kútiń...',
    save: 'Saqlaw',
    saving: 'Saqlanıp atır...',
    saved: 'Saqlandı',
    cancel: 'Biykarlaw',
    close: 'Jabıw',
    delete: 'Óshiriw',
    deleting: 'Óshirilip atır...',
    edit: 'Ózgertiw',
    create: 'Jaratıw',
    add: 'Qosıw',
    send: 'Jiberiw',
    sending: 'Jiberilip atır...',
    search: 'Izlew',
    searchPlaceholder: 'Kurs atın jazıń...',
    filter: 'Filtr',
    filters: 'Filtrler',
    clearFilters: 'Filtrlerdi tazalaw',
    apply: 'Qollanıw',
    all: 'Barlıǵı',
    yes: 'Hawa',
    no: 'Yaq',
    back: 'Keyin qaytıw',
    next: 'Keyingi',
    previous: 'Aldıńǵı',
    more: 'Kóbirek',
    less: 'Kemirek',
    showMore: 'Kóbirek kórsetiw',
    showLess: 'Jıynaw',
    retry: 'Qayta sınaw',
    tryAgain: 'Qayta sınap kóriń',
    confirm: 'Tastıyıqlaw',
    optional: 'Shárt emes',
    required: 'Shárt',
    copy: 'Kóshiriw',
    copied: 'Kóshirildi',
    download: 'Juklep alıw',
    open: 'Ashıw',
    view: 'Kóriw',
    viewAll: 'Barlıǵın kóriw',
    of: 'den',
    page: 'Bet',
    status: 'Halatı',
    actions: 'Háreketler',
    total: 'Jámi',
    date: 'Sáne',
    name: 'Atı',
    email: 'Email',
    password: 'Parol',
    role: 'Rol',
    comingSoon: 'Jaqında',
  },

  nav: {
    home: 'Bas bet',
    courses: 'Kurslar',
    categories: 'Baǵdarlar',
    about: 'Biz haqqımızda',
    dashboard: 'Jeke kabinet',
    myCourses: 'Meniń kurslarım',
    certificates: 'Sertifikatlar',
    settings: 'Sazlawlar',
    admin: 'Administrator paneli',
    login: 'Kiriw',
    register: 'Dizimnen ótiw',
    logout: 'Shıǵıw',
    profile: 'Profil',
    openMenu: 'Menyudi ashıw',
    closeMenu: 'Menyudi jabıw',
    toggleTheme: 'Temanı ózgertiw',
    themeLight: 'Jaqtı tema',
    themeDark: 'Qarańǵı tema',
    skipToContent: 'Tiykarǵı mazmunǵa ótiw',
  },

  /* ====================================================================
   * Landing page
   * ================================================================= */
  hero: {
    badge: 'Qaraqalpaq tilindegi IT bilim',
    title: 'IT kásibin ana tilińizde úyreniń',
    titleAccent: 'ana tilińizde',
    subtitle:
      'Frontend, backend, Python, jasalma intellekt hám dizayn baǵdarları boyınsha ' +
      'ámeliy kurslar. Hár sabaq qaraqalpaq tilinde, baslawshıdan professionalǵa shekem.',
    primaryCta: 'Kurslardı kóriw',
    secondaryCta: 'Biypul baslaw',
    stats: {
      courses: 'kurs',
      categories: 'baǵdar',
      lessons: 'sabaq',
      hours: 'saat video',
    },
    /** Labels inside the animated hero illustration. */
    illustration: {
      alt: 'Baylanısqan noqatlar hám kod elementlerinen dúzilgen animaciyalı suwret',
      learn: 'Úyreniw',
      practice: 'Ámeliyat',
      build: 'Jaratıw',
      progress: 'Ilgerilew',
    },
  },

  categories: {
    title: 'IT baǵdarları',
    subtitle: 'Ózińizge qolaylı baǵdardı saylap, bugin baslań.',
    courseCount: (count: number) => `${count} kurs`,
    empty: 'Házirshe baǵdarlar qosılmaǵan.',
    viewAll: 'Barlıq baǵdarlardı kóriw',
  },

  sections: {
    featured: {
      title: 'Tańlanǵan kurslar',
      subtitle: 'Eń kóp oqılatuǵın kurslar.',
    },
    newest: {
      title: 'Jańa kurslar',
      subtitle: 'Platformaǵa jańa qosılǵan kurslar.',
    },
    free: {
      title: 'Biypul kurslar',
      subtitle: 'Tólewsiz baslap kóriń.',
    },
    howItWorks: {
      title: 'Platforma qalay isleydi',
      subtitle: 'Tórt qádemde oqıwdı baslań.',
      steps: [
        {
          title: 'Dizimnen ótiń',
          description: 'Email arqalı tez hám biypul akkaunt jaratıń.',
        },
        {
          title: 'Kurs saylań',
          description: 'Baǵdar, dáreje hám baha boyınsha ózińizge qolaylısın tabıń.',
        },
        {
          title: 'Sabaqlardı ótiń',
          description: 'Video, maqala hám testler arqalı ámeliy túrde úyreniń.',
        },
        {
          title: 'Sertifikat alıń',
          description: 'Kurstı tamamlaǵannan soń tekseriwge bolatuǵın sertifikat beriledi.',
        },
      ],
    },
    benefits: {
      title: "Nege NAG'IS?",
      subtitle: 'Platformanıń tiykarǵı ayrıqshalıqları.',
      items: [
        {
          title: 'Tolıq qaraqalpaq tilinde',
          description:
            'Hár bir sabaq, tapsırma hám túsindirme ana tilińizde. Awdarma emes — ' +
            'baslanǵannan qaraqalpaq tilinde jazılǵan.',
        },
        {
          title: 'Ámeliyatqa tiykarlanǵan',
          description:
            'Hár modulda islenetuǵın tapsırma bar. Kurs aqırında tayar joybarıńız boladı.',
        },
        {
          title: 'Ózińizge qolaylı tempte',
          description:
            'Qashan qálesek, sol waqıtta oqıń. Ilgerilewińiz avtomat saqlanadı.',
        },
        {
          title: 'Tekseriwge bolatuǵın sertifikat',
          description:
            'Hár sertifikattıń ózine tán kodı bar. Onı qálegen adam saytta tekserip kóredi.',
        },
        {
          title: 'Telefonda da qolaylı',
          description: 'Platforma telefon, planshet hám kompyuterde birdey jaqsı isleydi.',
        },
        {
          title: 'Jańalanıp turatuǵın mazmun',
          description: 'Kurslar texnologiyalardıń ózgeriwine qarap jańalanadı.',
        },
      ],
    },
    instructors: {
      title: 'Oqıtıwshılarımız',
      subtitle: 'Tájriybeli qániygeler menen úyreniń.',
      courseCount: (count: number) => (count === 1 ? '1 kurs' : `${count} kurs`),
      empty: 'Házirshe oqıtıwshılar haqqında maǵlıwmat joq.',
    },
    faq: {
      title: 'Kóp berilgen sorawlar',
      subtitle: 'Eger juwabın tapalmasańız, bizge jazıń.',
      items: [
        {
          question: 'Kurslar qaraqalpaq tilinde me?',
          answer:
            'Hawa. Platformanıń pútkil interfeysi hám kurslardıń mazmunı qaraqalpaq ' +
            'tilinde (latın jazıwında). Tek programmalastırıw terminleri hám kodtıń ózi ' +
            'inglis tilinde qaladı — sebebi olar barlıq tillerde birdey jazıladı.',
        },
        {
          question: 'Oqıw ushın aldınǵı bilim kerek pe?',
          answer:
            'Hár kurstıń dárejesi kórsetilgen. "Baslawshı" dep belgilengen kurslar ushın ' +
            'hesh qanday aldınǵı tájriybe talap etilmeydi — tek kompyuter hám internet ' +
            'jetkilikli.',
        },
        {
          question: 'Biypul kurslar bar ma?',
          answer:
            'Hawa, bir neshe kurs tolıq biypul. Sonnan tısqarı, pullı kurslardıń bir ' +
            'bólegindegi sabaqlardı tólewsiz kórip, kurs sizge sáykes keletuǵının ' +
            'tekserip kórsetińiz múmkin.',
        },
        {
          question: 'Tólewdi qalay ámelge asıraman?',
          answer:
            'Házirgi waqıtta tólem sistemasınıń integraciyası tayarlanıp atır. Jergilikli ' +
            'tólem xızmetleri (Payme, Click) qosılǵannan soń pullı kurslardı satıp alıw ' +
            'imkaniyatı ashıladı. Házirshe biypul kurslarǵa jazılıw islep atır.',
        },
        {
          question: 'Sertifikat beriledi me?',
          answer:
            'Hawa. Kurstıń barlıq sabaqların tamamlaǵannan soń sertifikat avtomat ' +
            'beriledi. Hár sertifikattıń ózine tán tekseriw kodı bar hám onı ' +
            'platformada tekserip kóriwge boladı.',
        },
        {
          question: 'Ilgerilewim saqlanadı ma?',
          answer:
            'Hawa. Hár tamamlanǵan sabaq hám video kórgen jerińiz serverde saqlanadı. ' +
            'Basqa qurılmadan kirsengizde de sol jerden dawam etesiz.',
        },
        {
          question: 'Oqıtıwshı bolıp qosılıwım múmkin be?',
          answer:
            'Hawa. Eger IT tarawında tájriybeńiz bolsa hám qaraqalpaq tilinde kurs ' +
            'jaratıwǵa qızıqsańız, biz menen baylanısıń.',
        },
      ],
    },
    cta: {
      title: 'Bugin baslań',
      subtitle:
        'Dizimnen ótiw biypul. Birinshi biypul kursıńızdı bugin baslap jiberesiz.',
      primary: 'Biypul dizimnen ótiw',
      secondary: 'Kurslardı kóriw',
    },
  },

  footer: {
    about:
      "NAG'IS — Qaraqalpaqstanda IT bilimin qaraqalpaq tilinde ámeliy úyretiwge " +
      'qaratılǵan onlayn platforma.',
    sections: {
      platform: 'Platforma',
      categories: 'Baǵdarlar',
      support: 'Járdem',
      legal: 'Huqıqıy',
    },
    links: {
      courses: 'Kurslar',
      about: 'Biz haqqımızda',
      instructors: 'Oqıtıwshılar',
      verifyCertificate: 'Sertifikattı tekseriw',
      faq: 'Kóp berilgen sorawlar',
      contact: 'Baylanıs',
      terms: 'Paydalanıw shártleri',
      privacy: 'Jeke maǵlıwmatlar siyasatı',
    },
    contactTitle: 'Baylanıs',
    location: 'Nókis, Qaraqalpaqstan, Ózbekstan',
    rights: (year: number) => `© ${year} NAG'IS. Barlıq huqıqlar qorǵalǵan.`,
    builtIn: 'Qaraqalpaq tilinde islengen',
  },

  about: {
    title: 'Biz haqqımızda',
    lead:
      "NAG'IS — IT bilimin qaraqalpaq tilinde jetkeriw ushın islengen onlayn platforma.",
    missionTitle: 'Maqsetimiz',
    mission:
      'Qaraqalpaqstanda IT tarawına qızıǵıwshılar kóp, biraq sapalı oqıw materialları ' +
      'kóbinese basqa tillerde. Bul til kesenesi úyreniwdi awırlastıradı. ' +
      "NAG'IS sol kesenedi joq etiwdi maqset etedi: hár bir túsinik, hár bir mısal " +
      'hám hár bir tapsırma qaraqalpaq tilinde.',
    approachTitle: 'Yondashıwımız',
    approach: [
      {
        title: 'Til — tiykar',
        description:
          'Materiallar awdarılmaydı, bálkim qaraqalpaq tilinde jazıladı. Terminler ' +
          'birdey hám izbe-iz qollanıladı.',
      },
      {
        title: 'Ámeliyat — birinshi orında',
        description:
          'Teoriya tek kerekli kóleminde beriledi. Hár modul ámeliy tapsırma menen ' +
          'tamamlanadı.',
      },
      {
        title: 'Ashıqlıq',
        description:
          'Bahalar, kurs mazmunı hám sertifikat shártleri anıq kórsetiledi. ' +
          'Jasırın tólewler joq.',
      },
    ],
    statusTitle: 'Házirgi halat',
    statusBody:
      'Platforma islep shıǵarıw basqıshında. Tiykarǵı funkciyalar — kurs katalogı, ' +
      'oqıw ortalıǵı, ilgerilewdi saqlaw hám sertifikatlar — islep atır. Tólem ' +
      'sistemasınıń integraciyası tayarlanıp atır.',
    contactTitle: 'Baylanıs',
    contactBody: 'Soraw yamasa usınısıńız bolsa, bizge jazıń.',
  },

  /* ====================================================================
   * Course catalog
   * ================================================================= */
  catalog: {
    title: 'Kurslar',
    subtitle: 'Baǵdar, dáreje hám baha boyınsha ózińizge qolaylı kurstı tabıń.',
    resultCount: (count: number) => `${count} kurs tabıldı`,
    resultCountZero: 'Kurs tabılmadı',
    searchLabel: 'Kurs izlew',
    searchPlaceholder: 'Mısalı: JavaScript, dizayn, Python...',
    categoryLabel: 'Baǵdar',
    categoryAll: 'Barlıq baǵdarlar',
    levelLabel: 'Dáreje',
    priceLabel: 'Baha',
    sortLabel: 'Tártiplew',
    activeFilters: 'Qollanılǵan filtrler',
    removeFilter: (label: string) => `${label} filtrin alıp taslaw`,
    price: {
      all: 'Barlıǵı',
      free: 'Biypul',
      paid: 'Pullı',
    },
    sort: {
      newest: 'Jańaları aldın',
      oldest: 'Burınǵıları aldın',
      price_asc: 'Baha: arzannan qımbatqa',
      price_desc: 'Baha: qımbattan arzanǵa',
      rating: 'Bahalaw boyınsha',
      popular: 'Eń kóp oqılǵan',
      title: 'Atı boyınsha (A-Z)',
    },
    empty: {
      title: 'Hesh nárse tabılmadı',
      description:
        'Izlew sózin ózgertip yamasa filtrlerdi tazalap qayta sınap kóriń.',
      action: 'Filtrlerdi tazalaw',
    },
    error: {
      title: 'Kurslardı juklew sátsiz',
      description:
        'Serverge baylanısıwda qátelik júz berdi. Biraz kútip, qayta sınap kóriń.',
    },
    pagination: {
      label: 'Betler boyınsha navigaciya',
      previous: 'Aldıńǵı bet',
      next: 'Keyingi bet',
      pageOf: (page: number, total: number) => `${total} betten ${page}-si`,
    },
  },

  course: {
    level: {
      BEGINNER: 'Baslawshı',
      INTERMEDIATE: 'Orta dáreje',
      ADVANCED: 'Joqarı dáreje',
    },
    levelShort: {
      BEGINNER: 'Baslawshı',
      INTERMEDIATE: 'Orta',
      ADVANCED: 'Joqarı',
    },
    status: {
      DRAFT: 'Qaralama',
      PUBLISHED: 'Járiyalanǵan',
      ARCHIVED: 'Arxivlengen',
    },
    lessonType: {
      VIDEO: 'Video',
      ARTICLE: 'Maqala',
      QUIZ: 'Test',
    },
    free: 'Biypul',
    paid: 'Pullı',
    price: 'Bahası',
    /** Standalone labels, for definition lists. */
    lessonsLabel: 'Sabaqlar',
    modulesLabel: 'Modullar',
    studentsLabel: 'Oqıwshılar',
    currency: 'som',
    discount: (percent: number) => `${percent}% arzan`,
    instructor: 'Oqıtıwshı',
    duration: 'Dawamlılıǵı',
    lessons: (count: number) => `${count} sabaq`,
    modules: (count: number) => `${count} modul`,
    students: (count: number) => `${count} oqıwshı`,
    noRating: 'Bahalaw joq',
    ratingCount: (count: number) => (count === 1 ? '1 pikir' : `${count} pikir`),
    language: 'Til',
    languageKaa: 'Qaraqalpaq tili',
    updatedAt: 'Jańalanǵan',
    publishedAt: 'Járiyalanǵan',

    /* Detail page */
    aboutTitle: 'Kurs haqqında',
    objectivesTitle: 'Ne úyrenesiz',
    prerequisitesTitle: 'Aldınnan kerekli bilimler',
    prerequisitesNone: 'Aldınǵı bilim talap etilmeydi.',
    audienceTitle: 'Kurs kimge arnalǵan',
    curriculumTitle: 'Kurs programması',
    curriculumSummary: (modules: number, lessons: number, minutes: number) =>
      `${modules} modul · ${lessons} sabaq · ${minutes} minut`,
    reviewsTitle: 'Oqıwshılardıń pikirleri',
    reviewsEmpty: 'Bu kursqa házirshe pikir jazılmaǵan.',
    reviewsEmptyHint: 'Kurstı tamamlaǵannan soń birinshi pikirdi siz jazıwıńız múmkin.',
    instructorTitle: 'Oqıtıwshı haqqında',
    previewBadge: 'Tegin kóriw',
    lockedBadge: 'Jabıq',
    accessibleBadge: 'Ashıq',

    /* Enrolment */
    enroll: 'Kursqa jazılıw',
    enrolling: 'Jazılıp atır...',
    enrollFree: 'Biypul jazılıw',
    buy: 'Satıp alıw',
    enrolled: 'Siz bul kursqa jazılǵansız',
    continueLearning: 'Oqıwdı dawam etiw',
    startLearning: 'Oqıwdı baslaw',
    completed: 'Kurs tamamlandı',
    goToCourse: 'Kursqa ótiw',
    save: 'Saqlaw',
    saved: 'Saqlandı',
    unsave: 'Saqlawdan alıp taslaw',
    share: 'Bólisiw',
    linkCopied: 'Silteme kóshirildi',

    notFound: {
      title: 'Kurs tabılmadı',
      description: 'Bul kurs óshirilgen yamasa siltemede qátelik bar.',
      action: 'Barlıq kurslarǵa qaytıw',
    },
  },

  /* ====================================================================
   * Authentication
   * ================================================================= */
  auth: {
    login: {
      title: 'Akkauntqa kiriw',
      subtitle: 'Oqıwdı dawam etiw ushın kirińiz.',
      submit: 'Kiriw',
      submitting: 'Kirip atır...',
      noAccount: 'Akkauntıńız joq pa?',
      registerLink: 'Dizimnen ótiń',
      forgotPassword: 'Paroldi umıttıńız ba?',
    },
    register: {
      title: 'Akkaunt jaratıw',
      subtitle: 'Dizimnen ótiw biypul hám bir minut waqıt aladı.',
      submit: 'Dizimnen ótiw',
      submitting: 'Jaratılıp atır...',
      haveAccount: 'Akkauntıńız bar ma?',
      loginLink: 'Kiriń',
      acceptTerms: 'Paydalanıw shártlerin qabıl etemen',
      termsLink: 'Paydalanıw shártleri',
      privacyLink: 'Jeke maǵlıwmatlar siyasatı',
    },
    forgot: {
      title: 'Paroldi qayta tiklew',
      subtitle:
        'Email mánzilińizdi jazıń. Paroldi qayta tiklew siltemesin jiberemiz.',
      submit: 'Silteme jiberiw',
      submitting: 'Jiberilip atır...',
      successTitle: 'Xat jiberildi',
      successBody:
        'Eger bul email platformada dizimnen ótken bolsa, qayta tiklew siltemesi ' +
        'jiberildi. Pochtańızdı tekseriń.',
      backToLogin: 'Kiriw betine qaytıw',
    },
    reset: {
      title: 'Jańa parol belgilew',
      subtitle: 'Jańa parolińizdi kirgiziń.',
      submit: 'Paroldi ózgertiw',
      submitting: 'Ózgertilip atır...',
      successTitle: 'Parol ózgertildi',
      successBody: 'Endi jańa parolińiz menen kiriwińiz múmkin.',
      invalidTitle: 'Silteme jaramsız',
      invalidBody:
        'Bul silteme ámel etpeydi yamasa waqtı ótken. Jańa silteme sorań.',
      requestNew: 'Jańa silteme sorań',
    },
    fields: {
      fullName: 'Tolıq atıńız',
      fullNamePlaceholder: 'Atıńız hám familiyańız',
      email: 'Email',
      emailPlaceholder: 'siz@mısal.uz',
      password: 'Parol',
      passwordPlaceholder: 'Keminde 8 belgi',
      newPassword: 'Jańa parol',
      currentPassword: 'Házirgi parol',
      confirmPassword: 'Paroldi tastıyıqlaw',
      showPassword: 'Paroldi kórsetiw',
      hidePassword: 'Paroldi jasırıw',
    },
    passwordHint: 'Keminde 8 belgi, bir úlken hárip, bir kishi hárip hám bir san.',
    logoutConfirm: 'Shıǵıwdı qáleysiz be?',
    requireAuth: {
      title: 'Kiriw kerek',
      description: 'Bul betti kóriw ushın akkauntıńızǵa kirińiz.',
      action: 'Kiriw',
    },
  },

  /* ====================================================================
   * Validation & errors
   * These keys mirror the machine codes emitted by @nagis/shared-validation.
   * ================================================================= */
  validation: {
    required: 'Bul maydan toltırılıwı shárt',
    tooShort: 'Júdá qısqa',
    tooLong: 'Júdá uzın',
    'email.invalid': 'Email mánzili nadurıs',
    'email.tooLong': 'Email mánzili júdá uzın',
    'password.tooShort': 'Parol keminde 8 belgiden turıwı kerek',
    'password.tooLong': 'Parol júdá uzın',
    'password.needsLower': 'Parolda kishi hárip bolıwı kerek',
    'password.needsUpper': 'Parolda úlken hárip bolıwı kerek',
    'password.needsDigit': 'Parolda san bolıwı kerek',
    'password.mismatch': 'Paroller bir-birine sáykes emes',
    'fullName.tooShort': 'At júdá qısqa',
    'fullName.tooLong': 'At júdá uzın',
    'fullName.invalidChars': 'Atta jaramsız belgiler bar',
    'terms.required': 'Dawam etiw ushın shártlerdi qabıl etiwińiz kerek',
    'token.invalid': 'Silteme jaramsız',
    'slug.invalid': 'Tek kishi háripler, sanlar hám tire ruxsat etiledi',
    'slug.tooShort': 'Júdá qısqa',
    'rating.range': 'Bahalaw 1 den 5 ke shekem bolıwı kerek',
    'color.invalid': 'Reń kodı nadurıs (mısalı: #2563EB)',
    'uuid.invalid': 'Identifikator nadurıs',
    'url.invalid': 'Silteme nadurıs',
    'price.integer': 'Baha pútin san bolıwı kerek',
    'price.min': 'Baha teris bolıwı múmkin emes',
    'price.max': 'Baha júdá úlken',
    'duration.min': 'Dawamlılıq teris bolıwı múmkin emes',
    'list.tooMany': 'Elementler júdá kóp',
    'order.empty': 'Hesh qanday kurs saylanmaǵan',
    'order.tooMany': 'Bir buyırtpada júdá kóp kurs',
    'quiz.noAnswers': 'Hesh qanday juwap berilmegen',
    'quiz.needsTwoOptions': 'Keminde eki variant kerek',
    'quiz.needsOneCorrect': 'Tek bir durıs variant belgilengen bolıwı kerek',
    'quiz.needsQuestion': 'Keminde bir soraw kerek',
    'certificate.codeInvalid': 'Sertifikat kodı nadurıs',
  },

  errors: {
    /* Generic */
    INTERNAL: 'Serverde qátelik júz berdi. Biraz kútip, qayta sınap kóriń.',
    NETWORK: 'Serverge baylanısıp bolmadı. Internetińizdi tekseriń.',
    VALIDATION_FAILED: 'Kirgizilgen maǵlıwmatlarda qátelik bar',
    UNAUTHORIZED: 'Bul háreket ushın kiriw kerek',
    FORBIDDEN: 'Bul háreket ushın huqıqıńız jetispeydi',
    RATE_LIMITED: 'Júdá kóp soraw jiberildi. Biraz kútip, qayta sınań.',
    NOT_FOUND: 'Tabılmadı',
    UNIQUE_CONSTRAINT: 'Bunday jazıw álleqashan bar',
    FOREIGN_KEY_CONSTRAINT: 'Baylanıslı jazıw tabılmadı',
    RELATION_CONSTRAINT: 'Bul jazıwǵa basqa jazıwlar baylanısqan',

    /* Auth */
    EMAIL_TAKEN: 'Bul email álleqashan dizimnen ótken',
    INVALID_CREDENTIALS: 'Email yamasa parol nadurıs',
    ACCOUNT_DISABLED: 'Bul akkaunt ózgertilgen. Administrator menen baylanısıń.',
    INVALID_REFRESH_TOKEN: 'Sessiya waqtı ótken. Qaytadan kirińiz.',
    INVALID_RESET_TOKEN: 'Qayta tiklew siltemesi jaramsız yamasa waqtı ótken',
    CURRENT_PASSWORD_WRONG: 'Házirgi parol nadurıs',

    /* Catalog */
    USER_NOT_FOUND: 'Paydalanıwshı tabılmadı',
    CATEGORY_NOT_FOUND: 'Baǵdar tabılmadı',
    CATEGORY_SLUG_TAKEN: 'Bunday silteme (slug) álleqashan bar',
    CATEGORY_NOT_EMPTY: 'Bul baǵdarda kurslar bar. Aldın olardı kóshiriń yamasa óshiriń.',
    COURSE_NOT_FOUND: 'Kurs tabılmadı',
    COURSE_SLUG_TAKEN: 'Bunday silteme (slug) álleqashan bar',
    COURSE_NOT_PUBLISHED: 'Bul kurs házirshe járiyalanmaǵan',
    COURSE_HAS_NO_LESSONS: 'Bul kursta házirshe sabaqlar joq',
    MODULE_NOT_FOUND: 'Modul tabılmadı',
    LESSON_NOT_FOUND: 'Sabaq tabılmadı',
    LESSON_SLUG_TAKEN: 'Bunday sabaq siltemesi álleqashan bar',
    LESSON_LOCKED: 'Bul sabaq jabıq. Aldın kursqa jazılıwıńız kerek.',

    /* Enrolment & commerce */
    ALREADY_ENROLLED: 'Siz bul kursqa álleqashan jazılǵansız',
    NOT_ENROLLED: 'Siz bul kursqa jazılmaǵansız',
    PAYMENT_REQUIRED: 'Bul kurs pullı. Aldın tólewdi ámelge asırıń.',
    ORDER_NOT_FOUND: 'Buyırtpa tabılmadı',
    ORDER_EMPTY: 'Buyırtpa bos',
    ORDER_ALREADY_PAID: 'Bul buyırtpa álleqashan tólengen',
    ORDER_CONTAINS_FREE_COURSE: 'Biypul kurs ushın buyırtpa kerek emes — tuwrıdan jazılıń',
    ORDER_CONTAINS_OWNED_COURSE: 'Bul kurslardıń biri álleqashan sizde bar',
    PAYMENT_NOT_FOUND: 'Tólem tabılmadı',
    PAYMENT_PROVIDER_UNAVAILABLE:
      'Tólem sistemasi házirshe qosılmaǵan. Biypul kurslarǵa jazılıw islep atır.',
    PAYMENT_SIGNATURE_INVALID: 'Tólem maǵlıwmatınıń qol qoyıwı nadurıs',

    /* Learning */
    QUIZ_NOT_FOUND: 'Test tabılmadı',
    CERTIFICATE_NOT_FOUND: 'Sertifikat tabılmadı',
    CERTIFICATE_NOT_EARNED: 'Sertifikat ushın kurstıń barlıq sabaqların tamamlawıńız kerek',
    REVIEW_NOT_ALLOWED: 'Pikir jazıw ushın kursqa jazılǵan bolıwıńız kerek',
    REVIEW_ALREADY_EXISTS: 'Siz bul kursqa álleqashan pikir jazǵansız',
    VIDEO_PROVIDER_NOT_CONFIGURED: 'Video xızmeti házirshe qosılmaǵan',
    UPLOAD_REJECTED: 'Fayl qabıl etilmedi',

    /* Admin guards */
    CANNOT_DEMOTE_SELF: 'Óz rolińizdi ózgerte almaysız',
    CANNOT_DISABLE_SELF: 'Óz akkauntıńızdı ózgerte almaysız',
    LAST_ADMIN: 'Aqırǵı administratordı óshiriwge bolmaydı',
  },

  /* ====================================================================
   * Student dashboard
   * ================================================================= */
  dashboard: {
    greeting: (name: string) => `Sálem, ${name}!`,
    greetingFallback: 'Sálem!',
    subtitle: 'Oqıwıńızdı dawam etiń.',
    demoDataNotice:
      'Diqqat: bul akkauntta demo maǵlıwmatlar kórsetilgen (islep shıǵarıw rejimi).',

    stats: {
      activeCourses: 'Aktiv kurslar',
      completedCourses: 'Tamamlanǵan kurslar',
      completedLessons: 'Tamamlanǵan sabaqlar',
      learnedTime: 'Oqıw waqtı',
      certificates: 'Sertifikatlar',
      streak: 'Izbe-iz kúnler',
      streakDays: (days: number) => `${days} kún`,
    },

    continueTitle: 'Oqıwdı dawam etiw',
    continueEmpty: {
      title: 'Házirshe aktiv kursıńız joq',
      description: 'Katalogtan kurs saylap, bugin oqıwdı baslań.',
      action: 'Kurslardı kóriw',
    },
    nextLesson: 'Keyingi sabaq',
    progressLabel: (percent: number) => `${percent}% tamamlandı`,
    lessonsOf: (done: number, total: number) => `${total} sabaqtan ${done}-si`,

    activityTitle: 'Oqıw aktivligi',
    activitySubtitle: 'Aqırǵı 30 kún',
    activityEmpty: 'Házirshe aktivlik jazılmaǵan. Birinshi sabaqtı tamamlań.',
    activityLessons: 'Sabaqlar',
    activityMinutes: 'Minutlar',

    breakdownTitle: 'Baǵdarlar boyınsha',
    breakdownEmpty: 'Maǵlıwmat jetkilikli emes.',

    recentTitle: 'Aqırǵı háreketler',
    recentEmpty: 'Házirshe hesh qanday háreket joq.',
    recent: {
      LESSON_COMPLETED: 'Sabaq tamamlandı',
      COURSE_ENROLLED: 'Kursqa jazıldıńız',
      CERTIFICATE_ISSUED: 'Sertifikat berildi',
      QUIZ_PASSED: 'Test ótildi',
    },

    myCourses: {
      title: 'Meniń kurslarım',
      subtitle: 'Siz jazılǵan barlıq kurslar.',
      tabs: {
        all: 'Barlıǵı',
        active: 'Oqıp atırǵanlarım',
        completed: 'Tamamlanǵanları',
        saved: 'Saqlanǵanları',
      },
      empty: {
        title: 'Bu bólimde kurs joq',
        description: 'Katalogtan jańa kurs saylań.',
        action: 'Kurslardı kóriw',
      },
      savedEmpty: {
        title: 'Saqlanǵan kurs joq',
        description: 'Qızıqtırǵan kurslardı keyin oqıw ushın saqlap qoyıń.',
        action: 'Kurslardı kóriw',
      },
      enrolledAt: 'Jazılǵan',
      completedAt: 'Tamamlanǵan',
    },

    certificates: {
      title: 'Sertifikatlarım',
      subtitle: 'Tamamlanǵan kurslar ushın berilgen sertifikatlar.',
      empty: {
        title: 'Házirshe sertifikat joq',
        description:
          'Kurstıń barlıq sabaqların tamamlaǵannan soń sertifikat avtomat beriledi.',
        action: 'Kurslardı kóriw',
      },
      issuedAt: 'Berilgen sáne',
      code: 'Tekseriw kodı',
      verify: 'Tekseriw',
      viewCertificate: 'Sertifikattı kóriw',
      recipient: 'Kimge berildi',
      courseDuration: 'Kurs dawamlılıǵı',
    },

    orders: {
      title: 'Tólewler tariyxı',
      subtitle: 'Barlıq buyırtpalar hám olardıń halatı.',
      empty: {
        title: 'Buyırtpa joq',
        description: 'Házirshe hesh qanday satıp alıw ámelge asırılmaǵan.',
      },
      reference: 'Buyırtpa nomeri',
      createdAt: 'Jaratılǵan',
      paidAt: 'Tólengen',
      amount: 'Summa',
      items: 'Kurslar',
      status: {
        PENDING: 'Kútip atır',
        PAID: 'Tólengen',
        FAILED: 'Sátsiz',
        CANCELLED: 'Biykarlanǵan',
        REFUNDED: 'Qaytarılǵan',
      },
      paymentStatus: {
        CREATED: 'Jaratılǵan',
        PENDING: 'Kútip atır',
        SUCCEEDED: 'Tabıslı',
        FAILED: 'Sátsiz',
        CANCELLED: 'Biykarlanǵan',
        REFUNDED: 'Qaytarılǵan',
      },
      payNow: 'Tólew',
      demoPayment: 'Demo tólem (islep shıǵarıw rejimi)',
    },

    settings: {
      title: 'Sazlawlar',
      subtitle: 'Profil hám akkaunt sazlawları.',
      profileTitle: 'Profil maǵlıwmatları',
      profileSubtitle: 'Bul maǵlıwmatlar pikirlerińizde hám sertifikatta kórinedi.',
      headline: 'Qısqasha tanıstırıw',
      headlinePlaceholder: 'Mısalı: Informatika studenti',
      bio: 'Ózińiz haqqında',
      bioPlaceholder: 'Bir neshe sóz menen ózińizdi tanıstırıń...',
      emailReadonly: 'Email mánzilin ózgertiw házirshe qol jetimsiz.',
      passwordTitle: 'Paroldi ózgertiw',
      passwordSubtitle:
        'Parol ózgergennen soń barlıq qurılmalardaǵı sessiyalar jabıladı.',
      changePassword: 'Paroldi ózgertiw',
      appearanceTitle: 'Kórinis',
      appearanceSubtitle: 'Interfeys temasın saylań.',
      themeSystem: 'Sistema boyınsha',
      themeLight: 'Jaqtı',
      themeDark: 'Qarańǵı',
      languageTitle: 'Til',
      languageSubtitle: 'Házirshe tek qaraqalpaq tili qol jetimli.',
      profileSaved: 'Profil saqlandı',
      passwordChanged: 'Parol ózgertildi. Qaytadan kirińiz.',
      dangerTitle: 'Akkaunt',
      logoutAll: 'Barlıq qurılmalardan shıǵıw',
    },
  },

  /* ====================================================================
   * Learning environment
   * ================================================================= */
  learn: {
    backToCourse: 'Kursqa qaytıw',
    courseContent: 'Kurs mazmunı',
    openSidebar: 'Sabaqlar dizimin ashıw',
    closeSidebar: 'Sabaqlar dizimin jabıw',
    lessonOf: (current: number, total: number) => `${total} sabaqtan ${current}-si`,

    markComplete: 'Tamamlanǵan dep belgilew',
    marking: 'Belgilenip atır...',
    completed: 'Tamamlanǵan',
    markIncomplete: 'Belgini alıp taslaw',

    previousLesson: 'Aldıńǵı sabaq',
    nextLesson: 'Keyingi sabaq',
    courseFinished: {
      title: 'Qutlıqlaymız! Kurs tamamlandı',
      description: 'Barlıq sabaqlardı ótip boldıńız. Sertifikatıńız tayar.',
      action: 'Sertifikattı kóriw',
    },

    descriptionTitle: 'Sabaq haqqında',
    notesTitle: 'Meniń belgilewlerim',
    notesPlaceholder: 'Bul sabaq boyınsha belgilewlerińizdi jazıń...',
    notesHint: 'Belgilewler tek sizge kórinedi hám avtomat saqlanadı.',
    notesSaved: 'Belgilewler saqlandı',
    resourcesTitle: 'Qosımsha materiallar',
    resourcesEmpty: 'Bul sabaqta qosımsha material joq.',

    video: {
      notConfiguredTitle: 'Video xızmeti qosılmaǵan',
      notConfiguredBody:
        'Islep shıǵarıw ortalıǵında video hosting integraciyası sazlanmaǵan ' +
        '(VIDEO_DRIVER=none). Sabaqtıń tekstlik mazmunı tómende qol jetimli.',
      loading: 'Video juklenip atır...',
      error: 'Videodı juklew sátsiz boldı.',
    },

    locked: {
      title: 'Bul sabaq jabıq',
      description: 'Sabaqtı ashıw ushın kursqa jazılıwıńız kerek.',
      descriptionPaid: 'Bul kurs pullı. Sabaqlardı ashıw ushın kurstı satıp alıń.',
      action: 'Kursqa jazılıw',
    },

    quiz: {
      title: 'Test',
      start: 'Testti baslaw',
      questionOf: (current: number, total: number) => `${total} sorawdan ${current}-si`,
      submit: 'Juwaplardı jiberiw',
      submitting: 'Tekserilip atır...',
      selectAnswer: 'Juwaptı saylań',
      unanswered: 'Juwap berilmegen sorawlar bar',
      resultTitle: 'Test nátiyjesi',
      score: (score: number, max: number) => `${max} baldan ${score} bal`,
      percent: (percent: number) => `${percent}%`,
      passed: 'Test ótildi',
      failed: 'Test ótilmedi',
      passingScore: (score: number) => `Ótiw ushın: ${score}%`,
      correct: 'Durıs',
      incorrect: 'Nadurıs',
      yourAnswer: 'Sizdiń juwabıńız',
      correctAnswer: 'Durıs juwap',
      explanation: 'Túsindirme',
      noAnswer: 'Juwap berilmedi',
      retake: 'Qayta sınap kóriw',
      bestAttempt: (percent: number) => `Eń jaqsı nátiyje: ${percent}%`,
      continueToNext: 'Keyingi sabaqqa ótiw',
    },
  },

  /* ====================================================================
   * Certificate verification (public)
   * ================================================================= */
  verify: {
    title: 'Sertifikattı tekseriw',
    subtitle:
      'Sertifikattıń kodın kirgizip, onıń haqıyqıy ekenin tekserip kóriwińiz múmkin.',
    codeLabel: 'Sertifikat kodı',
    codePlaceholder: 'NAGIS-XXXX-XXXX-XXXX',
    submit: 'Tekseriw',
    submitting: 'Tekserilip atır...',
    validTitle: 'Sertifikat haqıyqıy',
    validBody: 'Bul sertifikat platformada dizimge alınǵan.',
    invalidTitle: 'Sertifikat tabılmadı',
    invalidBody:
      'Bunday kod penen sertifikat tabılmadı. Kodtı tekserip, qayta kirgiziń.',
    recipient: 'Kimge berildi',
    course: 'Kurs',
    instructor: 'Oqıtıwshı',
    issuedAt: 'Berilgen sáne',
    duration: 'Dawamlılıǵı',
  },

  /* ====================================================================
   * Admin panel
   * ================================================================= */
  admin: {
    title: 'Administrator paneli',
    subtitle: 'Platformanı basqarıw.',
    nav: {
      overview: 'Ulıwma kórinis',
      courses: 'Kurslar',
      categories: 'Baǵdarlar',
      lessons: 'Sabaqlar',
      users: 'Paydalanıwshılar',
      orders: 'Buyırtpalar',
      certificates: 'Sertifikatlar',
      audit: 'Hárekettler jurnalı',
      backToSite: 'Saytqa qaytıw',
    },

    overview: {
      title: 'Ulıwma kórinis',
      stats: {
        users: 'Paydalanıwshılar',
        students: 'Oqıwshılar',
        instructors: 'Oqıtıwshılar',
        courses: 'Kurslar',
        published: 'Járiyalanǵan',
        drafts: 'Qaralamalar',
        categories: 'Baǵdarlar',
        enrollments: 'Jazılıwlar',
        certificates: 'Sertifikatlar',
        paidOrders: 'Tólengen buyırtpalar',
        revenue: 'Tusim',
      },
      enrollmentTrend: 'Jazılıwlar dinamikası',
      revenueTrend: 'Túsim dinamikası',
      last30Days: 'Aqırǵı 30 kún',
      topCourses: 'Eń kóp jazılǵan kurslar',
      recentOrders: 'Aqırǵı buyırtpalar',
      noData: 'Maǵlıwmat joq',
      demoNotice:
        'Bul kórsetkishler islep shıǵarıw bazasınan alınǵan (demo maǵlıwmatlar).',
    },

    courses: {
      title: 'Kurslardı basqarıw',
      create: 'Jańa kurs',
      edit: 'Kurstı ózgertiw',
      searchPlaceholder: 'Kurs atı yamasa slug boyınsha izlew...',
      statusFilter: 'Halatı boyınsha',
      empty: {
        title: 'Kurslar joq',
        description: 'Birinshi kursıńızdı jaratıń.',
        action: 'Jańa kurs',
      },
      table: {
        title: 'Kurs',
        category: 'Baǵdar',
        instructor: 'Oqıtıwshı',
        level: 'Dáreje',
        price: 'Bahası',
        status: 'Halatı',
        lessons: 'Sabaqlar',
        enrollments: 'Jazılıwlar',
        rating: 'Bahalaw',
        updated: 'Jańalanǵan',
      },
      form: {
        basicsTitle: 'Tiykarǵı maǵlıwmatlar',
        titleLabel: 'Kurs atı',
        slugLabel: 'Silteme (slug)',
        slugHint: 'URL de kórinedi. Tek kishi háripler, sanlar hám tire.',
        slugGenerate: 'Attan jaratıw',
        summaryLabel: 'Qısqasha táriyp',
        summaryHint: 'Kurs kartochkasında kórinedi (300 belgige shekem).',
        descriptionLabel: 'Tolıq táriyp',
        descriptionHint: 'Markdown qollap-quwatlanadı.',
        categoryLabel: 'Baǵdar',
        instructorLabel: 'Oqıtıwshı',
        levelLabel: 'Dáreje',
        statusLabel: 'Halatı',
        languageLabel: 'Til',

        pricingTitle: 'Bahalaw',
        priceLabel: 'Bahası (som)',
        priceHint: '0 — kurs biypul boladı.',
        comparePriceLabel: 'Burınǵı bahası (som)',
        comparePriceHint:
          'Házirgi bahadan joqarı bolsa, shıynalǵan baha sıpatında kórsetiledi.',

        mediaTitle: 'Media',
        thumbnailLabel: 'Suwret siltemesi',
        promoVideoLabel: 'Tanıstırıw videosı siltemesi',

        contentTitle: 'Mazmun',
        objectivesLabel: 'Ne úyrenesiz',
        objectivesHint: 'Hár qatarǵa bir punkt.',
        prerequisitesLabel: 'Aldınnan kerekli bilimler',
        audienceLabel: 'Kurs kimge arnalǵan',

        publishTitle: 'Járiyalaw',
        publishHint:
          'Járiyalanǵan kurs katalogta kórinedi. Qaralama tek administratorlarǵa kórinedi.',
        publish: 'Járiyalaw',
        unpublish: 'Járiyalawdan alıp taslaw',
        archive: 'Arxivlew',

        created: 'Kurs jaratıldı',
        updated: 'Kurs jańalandı',
        deleted: 'Kurs óshirildi',
        deleteConfirm:
          'Bul kurstı óshiriwdi qáleysiz be? Barlıq modullar hám sabaqlar da óshiriledi.',
      },
      curriculum: {
        title: 'Kurs programması',
        subtitle: 'Modullar hám sabaqlardı basqarıw.',
        addModule: 'Modul qosıw',
        editModule: 'Moduldi ózgertiw',
        moduleTitleLabel: 'Modul atı',
        moduleDescriptionLabel: 'Modul táriypi',
        deleteModuleConfirm: 'Moduldi hám onıń barlıq sabaqların óshiriw?',
        addLesson: 'Sabaq qosıw',
        editLesson: 'Sabaqtı ózgertiw',
        lessonTitleLabel: 'Sabaq atı',
        lessonSlugLabel: 'Sabaq siltemesi',
        lessonTypeLabel: 'Sabaq túri',
        lessonDescriptionLabel: 'Qısqasha táriyp',
        lessonContentLabel: 'Mazmun (Markdown)',
        lessonVideoLabel: 'Video siltemesi yamasa ID',
        lessonVideoHint:
          'Video xızmeti qosılǵannan soń bul maydan provayderdiń ID sı bolıp isleydi.',
        lessonDurationLabel: 'Dawamlılıǵı (minut)',
        lessonPreviewLabel: 'Tegin kóriwge ashıq',
        lessonPreviewHint: 'Kursqa jazılmaǵan paydalanıwshılar da kóredi.',
        lessonPublishedLabel: 'Járiyalanǵan',
        deleteLessonConfirm: 'Bul sabaqtı óshiriw?',
        empty: 'Házirshe modul joq. Birinshi moduldi qosıń.',
        apiOnlyNotice:
          'Modul hám sabaqlardı ózgertiw API arqalı islep atır, biraq bul bette '
          + 'házirshe interfeys joq. Tómendegi mánzillerden paydalanıwıńız múmkin:',
        emptyLessons: 'Bul modulda sabaq joq.',
        moveUp: 'Joqarıǵa',
        moveDown: 'Tómenge',
      },
    },

    categories: {
      title: 'Baǵdarlardı basqarıw',
      create: 'Jańa baǵdar',
      edit: 'Baǵdardı ózgertiw',
      empty: {
        title: 'Baǵdarlar joq',
        description: 'Birinshi baǵdardı jaratıń.',
        action: 'Jańa baǵdar',
      },
      table: {
        name: 'Atı',
        slug: 'Silteme',
        courses: 'Kurslar',
        position: 'Tártibi',
        active: 'Aktiv',
      },
      form: {
        nameLabel: 'Baǵdar atı',
        slugLabel: 'Silteme (slug)',
        descriptionLabel: 'Táriypi',
        iconLabel: 'Ikonka atı',
        iconHint: 'Lucide ikonka atı, mısalı: Server, Palette, BrainCircuit.',
        accentLabel: 'Reń',
        accentHint: 'HEX formatında, mısalı: #2563EB',
        positionLabel: 'Tártip nomeri',
        activeLabel: 'Aktiv',
        created: 'Baǵdar jaratıldı',
        updated: 'Baǵdar jańalandı',
        deleted: 'Baǵdar óshirildi',
        deleteConfirm: 'Bul baǵdardı óshiriwdi qáleysiz be?',
      },
    },

    users: {
      title: 'Paydalanıwshılardı basqarıw',
      searchPlaceholder: 'At yamasa email boyınsha izlew...',
      roleFilter: 'Rol boyınsha',
      empty: {
        title: 'Paydalanıwshı tabılmadı',
        description: 'Izlew shártlerin ózgertip kóriń.',
      },
      table: {
        user: 'Paydalanıwshı',
        role: 'Rol',
        enrollments: 'Jazılıwları',
        status: 'Halatı',
        lastLogin: 'Aqırǵı kiriw',
        joined: 'Dizimnen ótken',
      },
      roles: {
        STUDENT: 'Oqıwshı',
        INSTRUCTOR: 'Oqıtıwshı',
        ADMIN: 'Administrator',
      },
      active: 'Aktiv',
      disabled: 'Ózgertilgen',
      never: 'Hesh qashan',
      changeRole: 'Roldi ózgertiw',
      disable: 'Ózgertiw',
      enable: 'Aktivlestiriw',
      updated: 'Paydalanıwshı jańalandı',
      roleChangeConfirm: (role: string) => `Roldi "${role}" ge ózgertiw?`,
    },

    orders: {
      title: 'Buyırtpalardı basqarıw',
      empty: {
        title: 'Buyırtpa joq',
        description: 'Házirshe hesh qanday buyırtpa jaratılmaǵan.',
      },
      table: {
        reference: 'Nomeri',
        user: 'Paydalanıwshı',
        items: 'Kurslar',
        total: 'Summa',
        status: 'Halatı',
        payment: 'Tólem',
        created: 'Jaratılǵan',
      },
      statusFilter: 'Halatı boyınsha',
    },

    certificates: {
      title: 'Sertifikatlar',
      empty: {
        title: 'Sertifikat joq',
        description: 'Házirshe hesh qanday sertifikat berilmegen.',
      },
      table: {
        code: 'Kodı',
        recipient: 'Kimge',
        course: 'Kurs',
        issued: 'Berilgen',
      },
    },
  },

  /* ====================================================================
   * Payments
   * ================================================================= */
  payment: {
    title: 'Tólew',
    orderSummary: 'Buyırtpa mazmunı',
    total: 'Jámi tólew',
    proceed: 'Tólewge ótiw',
    processing: 'Ámelge asırılıp atır...',
    successTitle: 'Tólem tabıslı',
    successBody: 'Kursqa jazılıwıńız ashıldı. Oqıwdı baslawıńız múmkin.',
    goToCourse: 'Kursqa ótiw',
    failedTitle: 'Tólem ámelge asпады',
    failedBody: 'Tólem támamlanmadı. Qayta sınap kóriń yamasa basqa usıl saylań.',

    /** Shown whenever PAYMENT_DRIVER is the development adapter. */
    devModeTitle: 'Islep shıǵarıw rejimi',
    devModeBody:
      'Tólem sistemasınıń haqıyqıy integraciyası házirshe qosılmaǵan. Bul — tek ' +
      'islep shıǵarıw ushın arnalǵan test adapteri. Haqıyqıy pul alınmaydı.',
    devModeConfirm: 'Test tólewin ámelge asırıw',

    notConfiguredTitle: 'Tólem házirshe qol jetimsiz',
    notConfiguredBody:
      'Jergilikli tólem xızmetleriniń integraciyası tayarlanıp atır. Sonǵa shekem ' +
      'biypul kurslarǵa jazılıwıńız múmkin.',
    browseFree: 'Biypul kurslardı kóriw',
  },

  /* ====================================================================
   * Reviews
   * ================================================================= */
  review: {
    writeTitle: 'Pikir jazıw',
    editTitle: 'Pikirdi ózgertiw',
    ratingLabel: 'Bahalawıńız',
    commentLabel: 'Pikirińiz',
    commentPlaceholder: 'Kurs haqqında pikirińizdi jazıń...',
    submit: 'Pikirdi jiberiw',
    submitting: 'Jiberilip atır...',
    submitted: 'Pikirińiz ushın raxmet!',
    updated: 'Pikir jańalandı',
    deleted: 'Pikir óshirildi',
    deleteConfirm: 'Pikirińizdi óshiriwdi qáleysiz be?',
    stars: (count: number) => `${count} juldız`,
    onlyEnrolled: 'Pikir jazıw ushın kursqa jazılǵan bolıwıńız kerek.',
  },

  /* ====================================================================
   * Legal pages
   *
   * Plain-language policy text. It describes exactly what this build does
   * today — no payment processing, no third-party analytics — so it should be
   * revised by whoever operates the platform before launch.
   * ================================================================= */
  legal: {
    updatedAt: 'Aqırǵı jańalanıw',
    draftNotice:
      'Diqqat: bul huqıqıy tekst platforma islep shıǵarıw basqıshında turǵanı ushın '
      + 'dáslepki kórinisinde. Platforma iske túsiriliwden aldın ol huqıqshı '
      + 'tárepinen tekseriliwi kerek.',

    terms: {
      title: 'Paydalanıw shártleri',
      lead:
        "NAG'IS platformasınan paydalanıw arqalı siz tómendegi shártlerdi qabıl "
        + 'etesiz.',
      sections: [
        {
          title: 'Xizmettiń mánisi',
          body:
            "NAG'IS — IT baǵdarları boyınsha onlayn kurslar usınatuǵın bilim beriw "
            + 'platformasi. Kurslardıń mazmunı tek bilim beriw maqsetinde usınıladı.',
        },
        {
          title: 'Akkaunt',
          body:
            'Akkauntıńızdıń paroli hám qáwipsizligi ushın óz juwapkershiligińiz. '
            + 'Bir akkaunttı basqalar menen bólisiw ruxsat etilmeydi. Durıs '
            + 'maǵlıwmat beriwińiz shárt.',
        },
        {
          title: 'Kursqa jazılıw hám tólew',
          body:
            'Biypul kurslarǵa dárhal jazılıwıńız múmkin. Pullı kurslar ushın tólem '
            + 'sistemasınıń integraciyası házirshe tamamlanmaǵan — sol sebepli bul '
            + 'build-ta haqıyqıy tólem qabıl etilmeydi.',
        },
        {
          title: 'Mazmunnan paydalanıw',
          body:
            'Kurs materialları tek jeke oqıw ushın. Olardı kóshirip tarqatıw, '
            + 'satıw yamasa basqa platformada járiyalaw ruxsat etilmeydi.',
        },
        {
          title: 'Sertifikatlar',
          body:
            'Kurs tolıq tamamlanǵannan soń sertifikat beriledi. Sertifikat tek '
            + "NAG'IS platformasında ótilgen kurstı tastıyıqlaydı hám mámleketlik "
            + 'diplom ornın basmaydı.',
        },
        {
          title: 'Shártlerdiń ózgeriwi',
          body:
            'Bul shártler ózgeriwi múmkin. Áhmiyetli ózgerisler haqqında '
            + 'paydalanıwshılarǵa xabar beriledi.',
        },
      ],
    },

    privacy: {
      title: 'Jeke maǵlıwmatlar siyasatı',
      lead:
        'Bul bette qanday maǵlıwmatlar jıynalatuǵını hám olar qalay '
        + 'paydalanılatuǵını túsindiriledi.',
      sections: [
        {
          title: 'Qanday maǵlıwmatlar jıynaladı',
          body:
            'Dizimnen ótiwde: atıńız hám email mánzilińiz. Oqıw procesinde: '
            + 'qaysı sabaqlardı tamamlaǵanıńız, test nátiyjelerińiz hám '
            + 'belgilewlerińiz. Sonnan tısqarı sessiya haqqında texnikalıq '
            + 'maǵlıwmat (IP mánzil, brauzer túri) saqlanadı.',
        },
        {
          title: 'Parol qalay saqlanadı',
          body:
            'Parolińiz hesh qashan ashıq kóriniste saqlanmaydı. Ol bcrypt '
            + 'algoritmi arqalı heshlenedi, sol sebepli onı qaytarıp oqıwdıń '
            + 'imkaniyatı joq — biz de onı kóre almaymız.',
        },
        {
          title: 'Maǵlıwmatlar nege paydalanıladı',
          body:
            'Tek xizmetti islew ushın: kirisiwdi támiyinlew, oqıw ilgerilewińizdi '
            + 'saqlaw, sertifikat beriw hám platformanı jaqsılaw. Maǵlıwmatlarıńız '
            + 'reklama maqsetinde satılmaydı.',
        },
        {
          title: 'Úshinshi tárepler',
          body:
            'Bul build-ta úshinshi táreptiń analitika yamasa reklama quralları '
            + 'qollanılmaydı. Tólem hám video xizmetleri qosılǵanda bul bólim '
            + 'jańalanadı.',
        },
        {
          title: 'Belgilewler (cookies)',
          body:
            'Tek sessiya ushın kerekli belgilewler qollanıladı. Olar HttpOnly '
            + 'bolıp, JavaScript arqalı oqılmaydı. Qadaǵalaw (tracking) '
            + 'belgilewleri paydalanılmaydı.',
        },
        {
          title: 'Huqıqlarıńız',
          body:
            'Óz maǵlıwmatlarıńızdı kóriw, ózgertiw yamasa akkauntıńızdı óshiriw '
            + 'huqıqıńız bar. Bul ushın biz menen baylanısıń: salem@nagis.uz',
        },
      ],
    },
  },

  /* ====================================================================
   * Not found / generic pages
   * ================================================================= */
  notFound: {
    title: 'Bet tabılmadı',
    code: '404',
    description:
      'Siz izlegen bet joq, kóshirilgen yamasa siltemede qátelik bar.',
    home: 'Bas betke qaytıw',
    courses: 'Kurslardı kóriw',
  },

  errorPage: {
    title: 'Qátelik júz berdi',
    description:
      'Kútilmegen qátelik júz berdi. Betti qayta juklep kóriń. Qátelik ' +
      'qaytalansa, bizge xabar beriń.',
    retry: 'Qayta juklew',
    home: 'Bas betke qaytıw',
  },

  /** Accessible labels for screen readers. */
  a11y: {
    loading: 'Mazmun juklenip atır',
    rating: (value: number) => `5 ten ${value} bal`,
    progressBar: (percent: number) => `Ilgerilew: ${percent} procent`,
    closeDialog: 'Dialogti jabıw',
    openInNewTab: 'Jańa bette ashıladı',
    required: 'Toltırılıwı shárt',
    chartDescription: 'Diagramma. Maǵlıwmatlar tómendegi kestede de keltirilgen.',
  },
} as const;

export type Dictionary = typeof kaa;
