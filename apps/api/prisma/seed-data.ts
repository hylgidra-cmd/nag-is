/**
 * Development seed content for NAG'IS.
 *
 * Everything in this file is DEMO data. Rows created from it are written with
 * `isDemo: true` so demo content can always be told apart from real
 * commercial records (and removed with a single query).
 *
 * All learner-facing text is Qaraqalpaq in Latin script. English is used only
 * for identifiers: slugs, Lucide icon names and enum values.
 */

import type { CourseLevel, LessonType } from '@nagis/shared-types';

export interface CategorySeed {
  slug: string;
  name: string;
  description: string;
  /** Lucide icon name. The web app resolves it with a safe fallback. */
  icon: string;
  accent: string;
  position: number;
}

export interface QuizOptionSeed {
  text: string;
  isCorrect?: boolean;
}

export interface QuizQuestionSeed {
  prompt: string;
  explanation: string;
  options: QuizOptionSeed[];
}

export interface QuizSeed {
  title: string;
  description: string;
  passingScore: number;
  questions: QuizQuestionSeed[];
}

export interface LessonSeed {
  title: string;
  slug: string;
  type: LessonType;
  durationMinutes: number;
  description: string;
  /** Markdown body. Present for ARTICLE lessons and as notes for VIDEO. */
  content?: string;
  isPreview?: boolean;
  quiz?: QuizSeed;
  resources?: { title: string; url: string; mimeType: string }[];
}

export interface ModuleSeed {
  title: string;
  description: string;
  lessons: LessonSeed[];
}

export interface CourseSeed {
  slug: string;
  title: string;
  summary: string;
  description: string;
  categorySlug: string;
  /** Key into INSTRUCTORS. */
  instructor: string;
  level: CourseLevel;
  /** Integer UZS so`m. 0 means free. */
  priceUzs: number;
  comparePriceUzs?: number;
  objectives: string[];
  prerequisites: string[];
  targetAudience: string[];
  modules: ModuleSeed[];
}

export interface InstructorSeed {
  email: string;
  fullName: string;
  headline: string;
  bio: string;
}

/* ==========================================================================
 * People
 * ======================================================================== */

export const INSTRUCTORS: Record<string, InstructorSeed> = {
  aybek: {
    email: 'aybek.qarataev@nagis.uz',
    fullName: 'Aybek Qarataev',
    headline: 'Frontend injener',
    bio:
      'Segiz jıldan berli veb-interfeysler islep shıǵaradı. React hám TypeScript boyınsha ' +
      'Nókistegi IT-kurslarda sabaq beredi. Oqıtıwda ámeliy joybarlarǵa tiykarlanadı.',
  },
  gulnaz: {
    email: 'gulnaz.seitova@nagis.uz',
    fullName: 'Gulnaz Seitova',
    headline: 'UI/UX dizayner',
    bio:
      'Paydalanıwshı tájriybesi hám interfeys dizaynı boyınsha qániyge. Mobil hám veb ' +
      'ónimler ushın dizayn sistemaların dúzedi. Figma hám dizayn izertlewine qızıǵadı.',
  },
  azamat: {
    email: 'azamat.nurjanov@nagis.uz',
    fullName: 'Azamat Nurjanov',
    headline: 'Backend hám DevOps injeneri',
    bio:
      'Serverli qollanbalar, maǵlıwmatlar bazaları hám bult infrastrukturası menen isleydi. ' +
      'Node.js, PostgreSQL hám Docker boyınsha ámeliy tájriybesi bar.',
  },
  dilnaza: {
    email: 'dilnaza.allambergenova@nagis.uz',
    fullName: 'Dilnaza Allambergenova',
    headline: 'Data analitik hám AI izertlewshi',
    bio:
      'Maǵlıwmatlar analitikası hám mashina úyreniwi boyınsha isleydi. Python, SQL hám ' +
      'statistika quralların ámeliyatta qollanıwdı úyretedi.',
  },
};

/* ==========================================================================
 * Categories — the twelve launch tracks
 * ======================================================================== */

export const CATEGORIES: CategorySeed[] = [
  {
    slug: 'frontend',
    name: 'Frontend islep shigariw',
    description:
      'Veb-saytlardiń paydalanıwshı kóretuǵın bólegin jaratıw: HTML, CSS, JavaScript hám React.',
    icon: 'LayoutTemplate',
    accent: '#2563EB',
    position: 1,
  },
  {
    slug: 'backend',
    name: 'Backend islep shigariw',
    description:
      'Server tárepi, API hám maǵlıwmatlar bazaları menen islew. Node.js, NestJS hám PostgreSQL.',
    icon: 'Server',
    accent: '#4F46E5',
    position: 2,
  },
  {
    slug: 'full-stack',
    name: 'Full-Stack islep shigariw',
    description:
      'Frontend hám backendti birge iyelew. Tolıq veb-ónimdi basınan ayaǵına shekem jaratıw.',
    icon: 'Layers',
    accent: '#7C3AED',
    position: 3,
  },
  {
    slug: 'jasalma-intellekt',
    name: 'Jasalma intellekt',
    description:
      'Mashina úyreniwi, neyron torları hám jasalma intellekt modellerin ámeliyatta qollanıw.',
    icon: 'BrainCircuit',
    accent: '#0891B2',
    position: 4,
  },
  {
    slug: 'prompt-injeneriya',
    name: 'Prompt injeneriyasi',
    description:
      'Úlken til modelleri menen nátiyjeli islew, soraw dúziw hám AI quralların paydalanıw.',
    icon: 'Sparkles',
    accent: '#0D9488',
    position: 5,
  },
  {
    slug: 'python',
    name: 'Python programmalastiriw',
    description:
      'Python tilin nolden iyelew: tiykarlar, maǵlıwmat strukturaları hám ámeliy joybarlar.',
    icon: 'FileCode2',
    accent: '#0284C7',
    position: 6,
  },
  {
    slug: 'kiberqawipsizlik',
    name: 'Kiberqawipsizlik',
    description:
      'Sistemalardı qorǵaw, qáwipsizlik tesiklerin tabıw hám maǵlıwmatlardı saqlaw usılları.',
    icon: 'ShieldCheck',
    accent: '#E11D48',
    position: 7,
  },
  {
    slug: 'ui-ux-dizayn',
    name: 'UI/UX ham grafikaliq dizayn',
    description:
      'Paydalanıwshı tájriybesi, interfeys dizaynı hám vizual kommunikaciya tiykarları.',
    icon: 'Palette',
    accent: '#DB2777',
    position: 8,
  },
  {
    slug: 'mobil-islep-shigariw',
    name: 'Mobil islep shigariw',
    description:
      'Android hám iOS ushın qollanbalar jaratıw. Flutter hám React Native menen islew.',
    icon: 'Smartphone',
    accent: '#059669',
    position: 9,
  },
  {
    slug: 'devops-bult',
    name: 'DevOps ham bult texnologiyalari',
    description:
      'Docker, CI/CD, serverlerdi basqarıw hám bult platformalarında joybar jaylastırıw.',
    icon: 'Cloud',
    accent: '#475569',
    position: 10,
  },
  {
    slug: 'magliwmatlar-analitikasi',
    name: 'Magliwmatlar analitikasi',
    description:
      'Maǵlıwmatlardı jıynaw, tazalaw, analiz etiw hám vizuallastırıw. SQL, Python hám statistika.',
    icon: 'ChartColumn',
    accent: '#D97706',
    position: 11,
  },
  {
    slug: 'oyin-islep-shigariw',
    name: 'Oyin islep shigariw',
    description:
      'Unity hám oyın dizaynı tiykarları. 2D hám 3D oyınlardı jaratıw hám jaylastırıw.',
    icon: 'Gamepad2',
    accent: '#9333EA',
    position: 12,
  },
];

/* ==========================================================================
 * Courses
 * ======================================================================== */

export const COURSES: CourseSeed[] = [
  /* ---------------------------------------------------------------- free */
  {
    slug: 'html-css-tiykarlari',
    title: 'HTML ham CSS: veb-betlerdin tiykarlari',
    summary:
      'Nolden baslap veb-bet jaratıwdı úyreniń: struktura, stil hám mobil qurılmalarǵa maslasıw.',
    description:
      'Bul kurs veb islep shıǵarıwdaǵı birinshi qádem. Siz HTML járdeminde bettiń ' +
      'strukturasın dúziwdi, CSS járdeminde onı sulıw hám qolaylı etiwdi úyrenesiz. ' +
      'Kurs dawamında bir neshe ámeliy tapsırma islenedi hám aqırında óz portfolio ' +
      'betińizdi jaratasız.\n\n' +
      'Hesh qanday aldınǵı tájriybe talap etilmeydi — tek kompyuter hám internet jetkilikli.',
    categorySlug: 'frontend',
    instructor: 'aybek',
    level: 'BEGINNER',
    priceUzs: 0,
    objectives: [
      'HTML tegleri hám semantikalıq struktura dúziw',
      'CSS penen reń, shrift hám jaylasıw basqarıw',
      'Flexbox hám Grid járdeminde maket jaratıw',
      'Mobil qurılmalarǵa maslasqan responsive dizayn islew',
      'Óz portfolio betińizdi jaratıp, internetke jaylastırıw',
    ],
    prerequisites: ['Kompyuterde islewdiń ulıwma kónlikpeleri'],
    targetAudience: [
      'IT tarawına jańa kirip atırǵanlar',
      'Universitet studentleri',
      'Veb-dizayn úyrenejaq bolǵanlar',
    ],
    modules: [
      {
        title: 'HTML tiykarlari',
        description: 'Veb-bettiń strukturasın dúziwdi úyrenemiz.',
        lessons: [
          {
            title: 'Kursqa kirisiw ham ortaliqti sazlaw',
            slug: 'kirisiw',
            type: 'VIDEO',
            durationMinutes: 12,
            isPreview: true,
            description:
              'Kurs qalay quralǵanı, qanday quraldan paydalanamız hám VS Code sazlaw.',
            content:
              '## Bul sabaqta\n\n' +
              '- Kurstıń dúzilisi hám qalay oqıw kerekligi\n' +
              '- VS Code hám brauzer sazlawları\n' +
              '- Birinshi `index.html` faylın jaratıw\n\n' +
              'Kerekli quraldar: **VS Code**, **Google Chrome**.',
          },
          {
            title: 'HTML tegleri ham dokument strukturasi',
            slug: 'html-tegleri',
            type: 'VIDEO',
            durationMinutes: 18,
            isPreview: true,
            description: 'Teg, atribut hám HTML dokumenttiń tiykarǵı bólimleri.',
          },
          {
            title: 'Tekst, siltemeler ham suwretler',
            slug: 'tekst-siltemeler-suwretler',
            type: 'VIDEO',
            durationMinutes: 20,
            description: 'Sarlawqalar, abzaclar, siltemeler hám suwretler menen islew.',
          },
          {
            title: 'Semantikaliq HTML',
            slug: 'semantikaliq-html',
            type: 'ARTICLE',
            durationMinutes: 15,
            description: 'Nege `div` ornına `header`, `main`, `article` qollanıw kerek.',
            content:
              '## Semantikaliq tegler\n\n' +
              'Semantikalıq tegler bettiń mánisin anıqlaydı. Bul eki sebepten áhmiyetli:\n\n' +
              '1. **Qolaylılıq** — ekran oqıwshıları (screen reader) bettiń dúzilisin ' +
              'túsinedi.\n' +
              '2. **SEO** — izlew sistemaları mazmunnı durıs indekslaydı.\n\n' +
              '### Tiykarǵi tegler\n\n' +
              '| Teg | Mánisi |\n' +
              '| --- | --- |\n' +
              '| `<header>` | Bettiń yamasa bólimniń basınday bólegi |\n' +
              '| `<nav>` | Navigaciya siltemeleri |\n' +
              '| `<main>` | Bettiń tiykarǵı mazmunı |\n' +
              '| `<article>` | Óz betinshe mániske iye mazmun |\n' +
              '| `<footer>` | Bettiń ayaǵı |\n\n' +
              '> Eslete: bir bette `<main>` tek bir mártebe bolıwı kerek.',
          },
          {
            title: 'Modul boyinsha test',
            slug: 'html-test',
            type: 'QUIZ',
            durationMinutes: 10,
            description: 'HTML tiykarları boyınsha bilimińizdi tekseriń.',
            quiz: {
              title: 'HTML tiykarlari testi',
              description: 'Bes soraw. Ótiw ushın 60% kerek.',
              passingScore: 60,
              questions: [
                {
                  prompt: 'HTML dokumenttiń tiykarǵı sarlawqası qaysı teg penen jazıladı?',
                  explanation:
                    '`<h1>` bettiń eń áhmiyetli sarlawqası. Bir bette bir `<h1>` bolıwı maqul.',
                  options: [
                    { text: '<h1>', isCorrect: true },
                    { text: '<head>' },
                    { text: '<title>' },
                    { text: '<header>' },
                  ],
                },
                {
                  prompt: 'Suwretti betke qosıw ushın qaysı teg paydalanıladı?',
                  explanation: '`<img>` tegi `src` hám `alt` atributların talap etedi.',
                  options: [
                    { text: '<picture>' },
                    { text: '<img>', isCorrect: true },
                    { text: '<image>' },
                    { text: '<src>' },
                  ],
                },
                {
                  prompt: '`alt` atributı nege kerek?',
                  explanation:
                    'Suwret júklenbegende yamasa ekran oqıwshısı ushın tekstlik túsindirme beredi.',
                  options: [
                    { text: 'Suwrettiń ólshemin belgilew ushın' },
                    { text: 'Suwretti ortaǵa jaylastırıw ushın' },
                    {
                      text: 'Suwret kórinbegende tekstlik túsindirme beriw ushın',
                      isCorrect: true,
                    },
                    { text: 'Suwrettiń formatın anıqlaw ushın' },
                  ],
                },
                {
                  prompt: 'Qaysı teg semantikalıq emes?',
                  explanation:
                    '`<div>` tek quti (container) bolıp, hesh qanday máni bildirmeydi.',
                  options: [
                    { text: '<nav>' },
                    { text: '<div>', isCorrect: true },
                    { text: '<article>' },
                    { text: '<footer>' },
                  ],
                },
                {
                  prompt: 'Siltemeni jańa betke ashıw ushın qanday atribut qosıladı?',
                  explanation: '`target="_blank"` siltemeni jańa tabta ashadı.',
                  options: [
                    { text: 'target="_blank"', isCorrect: true },
                    { text: 'new="true"' },
                    { text: 'open="new"' },
                    { text: 'rel="new"' },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        title: 'CSS penen stil beriw',
        description: 'Bettiń kórinisin basqarıwdı úyrenemiz.',
        lessons: [
          {
            title: 'CSS selektorlari ham qasiyetleri',
            slug: 'css-selektorlar',
            type: 'VIDEO',
            durationMinutes: 22,
            description: 'Selektorlar, reńler, shriftler hám tiykarǵı CSS qasiyetleri.',
          },
          {
            title: 'Box model: margin, padding, border',
            slug: 'box-model',
            type: 'VIDEO',
            durationMinutes: 19,
            description: 'Elementlerdiń ólshemi hám aralıqları qalay esaplanadı.',
          },
          {
            title: 'Flexbox penen jaylastiriw',
            slug: 'flexbox',
            type: 'VIDEO',
            durationMinutes: 25,
            description: 'Bir qatarda yamasa baǵanada elementlerdi tegis jaylastırıw.',
          },
          {
            title: 'CSS Grid',
            slug: 'css-grid',
            type: 'VIDEO',
            durationMinutes: 24,
            description: 'Eki ólshemli maket dúziw ushın Grid sistemasın qollanıw.',
          },
          {
            title: 'Responsive dizayn ham media sorawlari',
            slug: 'responsive-dizayn',
            type: 'VIDEO',
            durationMinutes: 21,
            description: 'Telefon, planshet hám kompyuterge maslasqan bet jaratıw.',
            resources: [
              {
                title: 'Breakpoint kesteleri (PDF)',
                url: 'https://example.invalid/nagis/demo/breakpoints.pdf',
                mimeType: 'application/pdf',
              },
            ],
          },
        ],
      },
      {
        title: 'Juwmaqlawshi joybar',
        description: 'Úyrengenlerińizdi bir joybarda birlestiremiz.',
        lessons: [
          {
            title: 'Portfolio betin joybarlaw',
            slug: 'portfolio-joybarlaw',
            type: 'VIDEO',
            durationMinutes: 16,
            description: 'Bettiń strukturasın hám dizaynın jobalastıramız.',
          },
          {
            title: 'Portfolio betin islep shigariw',
            slug: 'portfolio-islep-shigariw',
            type: 'VIDEO',
            durationMinutes: 34,
            description: 'HTML hám CSS járdeminde tolıq betti jazamız.',
          },
          {
            title: 'Joybardi internetke jaylastiriw',
            slug: 'joybardi-jaylastiriw',
            type: 'ARTICLE',
            durationMinutes: 14,
            description: 'GitHub Pages járdeminde saytıńızdı biypul jaylastırıw.',
            content:
              '## GitHub Pages\n\n' +
              '1. GitHub-ta jańa repozitoriy jaratıń.\n' +
              '2. Fayllarıńızdı júklep beriń (`index.html`, `style.css`).\n' +
              '3. **Settings -> Pages** bólimine kiriń.\n' +
              '4. Branch sıpatında `main`, papka sıpatında `/ (root)` saylań.\n' +
              '5. Bir neshe minuttan soń saytıńız `https://<atıńız>.github.io/<repo>` ' +
              'mánzilinde isleydi.\n\n' +
              '> Bul usıl statikalıq saytlar ushın tolıq biypul.',
          },
        ],
      },
    ],
  },

  {
    slug: 'prompt-injeneriya-tiykarlari',
    title: 'Prompt injeneriyasi: AI menen natiyjeli islew',
    summary:
      'Úlken til modellerinen anıq hám paydalı juwap alıw usılların ámeliyatta úyreniń.',
    description:
      'Jasalma intellekt quralları endi hár tarawda qollanıladı. Biraq nátiyje kóp ' +
      'jaǵdayda sorawdıń qalay qoyılǵanına baylanıslı. Bul kursta siz prompt dúziwdiń ' +
      'ámeliy usılların, modelldiń sheklewlerin hám qátelerden qalay saqlanıwdı ' +
      'úyrenesiz.\n\n' +
      'Kurs biypul hám hár kimge ashıq.',
    categorySlug: 'prompt-injeneriya',
    instructor: 'dilnaza',
    level: 'BEGINNER',
    priceUzs: 0,
    objectives: [
      'Anıq hám strukturalı prompt dúziw',
      'Kontekst hám rol beriw usılların qollanıw',
      'Few-shot hám chain-of-thought usılların túsiniw',
      'Modelldiń qáteliklerin (gallyucinaciya) anıqlaw',
      'Jumısta AI quralların qáwipsiz paydalanıw',
    ],
    prerequisites: ['Internetten paydalanıw kónlikpesi'],
    targetAudience: [
      'Hár tarawdaǵı qániygeler',
      'Studentler hám oqıtıwshılar',
      'Kontent jaratıwshılar',
    ],
    modules: [
      {
        title: 'Tiykarlar',
        description: 'Til modelleri qalay isleydi hám prompt nege áhmiyetli.',
        lessons: [
          {
            title: 'Úlken til modelleri qalay isleydi',
            slug: 'til-modelleri',
            type: 'VIDEO',
            durationMinutes: 15,
            isPreview: true,
            description: 'Token, kontekst hám modelldiń sheklewleri haqqında qısqa túsinik.',
          },
          {
            title: 'Jaqsi promptin bes elementi',
            slug: 'jaqsi-prompt',
            type: 'ARTICLE',
            durationMinutes: 12,
            description: 'Rol, maqset, kontekst, format hám sheklewler.',
            content:
              '## Jaqsi promptin bes elementi\n\n' +
              '1. **Rol** — modelge qanday qániyge rolinde juwap beriwin aytıń.\n' +
              '2. **Maqset** — ne kerekligin anıq jazıń.\n' +
              '3. **Kontekst** — kerekli maǵlıwmattı beriń.\n' +
              '4. **Format** — juwap qanday kóriniste bolıwın kórsetiń.\n' +
              '5. **Sheklewler** — uzınlıq, til, stil sıyaqlı talaplar.\n\n' +
              '### Mısal\n\n' +
              '```\n' +
              'Sen tájriybeli redaktorsań.\n' +
              'Tómendegi tekstti qaraqalpaq tilinde 100 sózge qısqart.\n' +
              'Tiykarǵı pikirdi saqla, terminlerdi ózgertpe.\n' +
              'Juwaptı tek tekst sıpatında ber.\n' +
              '```',
          },
          {
            title: 'Kontekst ham rol beriw',
            slug: 'kontekst-rol',
            type: 'VIDEO',
            durationMinutes: 18,
            description: 'Modelge dógerek maǵlıwmat beriwdiń ámeliy usılları.',
          },
        ],
      },
      {
        title: 'Ameliy usillar',
        description: 'Nátiyjeni jaqsılaytuǵın tanılǵan usıllar.',
        lessons: [
          {
            title: 'Few-shot: misallar menen uyretiw',
            slug: 'few-shot',
            type: 'VIDEO',
            durationMinutes: 16,
            description: 'Bir neshe mısal beriw arqalı kerekli formattı alıw.',
          },
          {
            title: 'Qadembe-qadem oylaw (chain-of-thought)',
            slug: 'chain-of-thought',
            type: 'VIDEO',
            durationMinutes: 17,
            description: 'Quramalı mashqalalardı bólimlerge bóliw usılı.',
          },
          {
            title: 'Gallyucinaciyani aniqlaw',
            slug: 'gallyucinaciya',
            type: 'ARTICLE',
            durationMinutes: 13,
            description: 'Model qáte maǵlıwmat berse, onı qalay seziw kerek.',
            content:
              '## Gallyucinaciya degen ne?\n\n' +
              'Til modeli kerek jaǵdayda bilmeytuǵın nárseni de **isenimli túrde** ' +
              'aytıp jiberiwi múmkin. Bul qubılıs gallyucinaciya dep ataladı.\n\n' +
              '### Qalay saqlanıw kerek\n\n' +
              '- Faktlerdi ǵalabalıq derekten tekseriń\n' +
              '- Modelge derek kórsetiwdi talap etiń\n' +
              '- Sanlar hám sáneler boyınsha ayrıqsha itibarlı bolıń\n' +
              '- Juwaptı eki túrli prompt penen salıstırıń\n\n' +
              '> Qaǵıyda: AI juwabı — baslanıw noqatı, aqırǵı haqıyqat emes.',
          },
          {
            title: 'Modul boyinsha test',
            slug: 'prompt-test',
            type: 'QUIZ',
            durationMinutes: 8,
            description: 'Prompt dúziw qaǵıydaları boyınsha test.',
            quiz: {
              title: 'Prompt injeneriyasi testi',
              description: 'Tórt soraw. Ótiw ushın 60% kerek.',
              passingScore: 60,
              questions: [
                {
                  prompt: 'Promptta "rol" beriw nege paydalı?',
                  explanation:
                    'Rol modelldiń stilin hám tereńligin kerekli tárepke baslaydı.',
                  options: [
                    { text: 'Juwaptı qısqartadı' },
                    {
                      text: 'Juwaptıń stili hám tereńligin kerekli tárepke baslaydı',
                      isCorrect: true,
                    },
                    { text: 'Modelldiń tezligin asıradı' },
                    { text: 'Tokenlerdi tejeydi' },
                  ],
                },
                {
                  prompt: 'Few-shot usılı nede?',
                  explanation:
                    'Promptqa bir neshe tayar mısal qosılıp, model soǵan qarap formatlaydı.',
                  options: [
                    { text: 'Promptti qısqa jazıwda' },
                    { text: 'Bir neshe mısal beriwde', isCorrect: true },
                    { text: 'Modeldi qaytadan oqıtıwda' },
                    { text: 'Tek bir soraw beriwde' },
                  ],
                },
                {
                  prompt: 'Gallyucinaciya degende ne túsiniledi?',
                  explanation:
                    'Model bilmeytuǵın nársesin isenimli túrde durıs sıpatında aytıwı.',
                  options: [
                    { text: 'Modelldiń juwap bermewi' },
                    { text: 'Modelldiń qáte maǵlıwmattı isenimli aytıwı', isCorrect: true },
                    { text: 'Juwaptıń júdá uzın bolıwı' },
                    { text: 'Tildiń ózgeriwi' },
                  ],
                },
                {
                  prompt: 'Juwap formatın kórsetiw nege kerek?',
                  explanation:
                    'Format kórsetilse, nátiyje bir qıylı hám keyin islewge qolaylı boladı.',
                  options: [
                    {
                      text: 'Nátiyje bir qıylı hám keyingi islewge qolaylı bolıwı ushın',
                      isCorrect: true,
                    },
                    { text: 'Model tezirek islewi ushın' },
                    { text: 'Prompt qısqa bolıwı ushın' },
                    { text: 'Hesh qanday áhmiyeti joq' },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- paid */
  {
    slug: 'javascript-nolden-professional',
    title: 'JavaScript: nolden professional darejege',
    summary:
      'Tildiń tiykarlarınan asinxron programmalastırıwǵa shekem — ámeliy mısallar menen.',
    description:
      'JavaScript — veb islep shıǵarıwdıń tiykarǵı tili. Bul kursta siz tildiń ' +
      'tiykarlarınan baslap, DOM penen islew, asinxron funkciyalar hám zamanagóy ES ' +
      'standartlarına shekem úyrenesiz.\n\n' +
      'Hár modulda ámeliy tapsırmalar bar. Kurs aqırında bir neshe tolıq joybar ' +
      'islenedi.',
    categorySlug: 'frontend',
    instructor: 'aybek',
    level: 'BEGINNER',
    priceUzs: 490_000,
    comparePriceUzs: 690_000,
    objectives: [
      'Ózgeriwshiler, funkciyalar hám maǵlıwmat strukturaları menen islew',
      'DOM arqalı bettiń elementlerin basqarıw',
      'Waqıyalar (events) menen interaktivlik qosıw',
      'Promise hám async/await penen asinxron kod jazıw',
      'Fetch API arqalı serverden maǵlıwmat alıw',
    ],
    prerequisites: ['HTML hám CSS boyınsha baslawshı bilim'],
    targetAudience: ['Frontend úyrenejaq bolǵanlar', 'HTML/CSS bilgen baslawshılar'],
    modules: [
      {
        title: 'Til tiykarlari',
        description: 'JavaScript sintaksisi hám tiykarǵı túsinikler.',
        lessons: [
          {
            title: 'JavaScript penen tanisiw',
            slug: 'js-tanisiw',
            type: 'VIDEO',
            durationMinutes: 14,
            isPreview: true,
            description: 'Til qalay payda bolǵanı hám bugin qayda qollanılatuǵını.',
          },
          {
            title: 'Ozgeriwshiler ham maglimat tipleri',
            slug: 'ozgeriwshiler',
            type: 'VIDEO',
            durationMinutes: 22,
            description: 'let, const, string, number, boolean hám basqalar.',
          },
          {
            title: 'Shartlar ham cikller',
            slug: 'shartlar-cikller',
            type: 'VIDEO',
            durationMinutes: 20,
            description: 'if/else, switch, for hám while konstrukciyaları.',
          },
          {
            title: 'Funkciyalar',
            slug: 'funkciyalar',
            type: 'VIDEO',
            durationMinutes: 24,
            description: 'Funkciya dúziw, parametrler hám arrow funkciyaları.',
          },
          {
            title: 'Massivler ham obyektler',
            slug: 'massivler-obyektler',
            type: 'VIDEO',
            durationMinutes: 26,
            description: 'map, filter, reduce hám obyekt penen islew usılları.',
          },
        ],
      },
      {
        title: 'DOM ham waqiyalar',
        description: 'Betti JavaScript arqalı basqarıw.',
        lessons: [
          {
            title: 'DOM degen ne',
            slug: 'dom-degen-ne',
            type: 'VIDEO',
            durationMinutes: 17,
            description: 'Bettiń aǵash strukturası hám onı tabıw usılları.',
          },
          {
            title: 'Elementlerdi ozgertiw',
            slug: 'elementlerdi-ozgertiw',
            type: 'VIDEO',
            durationMinutes: 21,
            description: 'Tekst, klass hám stillerdi kod arqalı ózgertiw.',
          },
          {
            title: 'Waqiyalar menen islew',
            slug: 'waqiyalar',
            type: 'VIDEO',
            durationMinutes: 23,
            description: 'click, input, submit hám waqıya delegaciyası.',
          },
          {
            title: 'Ameliy joybar: TODO dizimi',
            slug: 'todo-joybari',
            type: 'VIDEO',
            durationMinutes: 38,
            description: 'Tolıq interaktiv TODO qollanbasın jazamız.',
          },
        ],
      },
      {
        title: 'Asinxron JavaScript',
        description: 'Server menen islew hám waqıtqa baylanıslı kod.',
        lessons: [
          {
            title: 'Callback ham Promise',
            slug: 'callback-promise',
            type: 'VIDEO',
            durationMinutes: 25,
            description: 'Asinxronlıq nege kerek hám Promise qalay isleydi.',
          },
          {
            title: 'async/await',
            slug: 'async-await',
            type: 'VIDEO',
            durationMinutes: 19,
            description: 'Asinxron kodtı oqıwǵa ańsat kóriniste jazıw.',
          },
          {
            title: 'Fetch API ham qatelerdi qayta islew',
            slug: 'fetch-api',
            type: 'VIDEO',
            durationMinutes: 27,
            description: 'Serverden maǵlıwmat alıw hám qátelerdi durıs basqarıw.',
          },
          {
            title: 'Modul boyinsha test',
            slug: 'async-test',
            type: 'QUIZ',
            durationMinutes: 10,
            description: 'Asinxron JavaScript boyınsha test.',
            quiz: {
              title: 'Asinxron JavaScript testi',
              description: 'Úsh soraw. Ótiw ushın 60% kerek.',
              passingScore: 60,
              questions: [
                {
                  prompt: '`await` kalit sózi qayda qollanıladı?',
                  explanation:
                    '`await` tek `async` funkciya ishinde (yamasa modul tómeninde) isleydi.',
                  options: [
                    { text: 'Qálegen funkciya ishinde' },
                    { text: '`async` funkciya ishinde', isCorrect: true },
                    { text: 'Tek cikl ishinde' },
                    { text: 'Tek klass ishinde' },
                  ],
                },
                {
                  prompt: 'Promise qanday halatlarda bolıwı múmkin?',
                  explanation:
                    'pending (kútip atır), fulfilled (orınlandı) hám rejected (biykarlandı).',
                  options: [
                    { text: 'pending, fulfilled, rejected', isCorrect: true },
                    { text: 'start, run, stop' },
                    { text: 'open, close' },
                    { text: 'true, false' },
                  ],
                },
                {
                  prompt: '`fetch` qáte beretuǵın jaǵdayda ne qaytaradı?',
                  explanation:
                    'Tarmaq qátesinde Promise rejected boladı; 404 sıyaqlı jaǵdayda bolsa ' +
                    'Promise orınlanadı, biraq `response.ok` false boladı.',
                  options: [
                    { text: 'Hámme waqıt qáte taslaydı' },
                    {
                      text: 'Tarmaq qátesinde rejected, 404-te bolsa ok=false',
                      isCorrect: true,
                    },
                    { text: 'Hesh nárse qaytarmaydı' },
                    { text: 'Hámme waqıt null' },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },

  {
    slug: 'react-zamanagoy-interfeysler',
    title: 'React penen zamanagoy interfeysler',
    summary:
      'Komponentler, holat basqarıw hám hooks arqalı ózgeriwshi veb-qollanbalar jaratıń.',
    description:
      'React — bugingi kúnde eń kóp qollanılatuǵın frontend kitapxanası. Bul kursta ' +
      'komponentlik oylawdı, holat (state) basqarıwdı, hooks sistemasın hám ámeliy ' +
      'joybar dúzilisin úyrenesiz.\n\n' +
      'Kurs JavaScript bilgen oqıwshılar ushın arnalǵan.',
    categorySlug: 'frontend',
    instructor: 'aybek',
    level: 'INTERMEDIATE',
    priceUzs: 790_000,
    comparePriceUzs: 990_000,
    objectives: [
      'Komponentler hám props penen islew',
      'useState hám useEffect hooks larin qollanıw',
      'Formalar hám paydalanıwshı kirgizgen maǵlıwmattı basqarıw',
      'React Router arqalı kóp betli qollanba jaratıw',
      'Komponentlerdi qayta paydalanıwǵa ılayıq etip bóliw',
    ],
    prerequisites: ['JavaScript boyınsha isenimli bilim', 'HTML hám CSS'],
    targetAudience: ['JavaScript bilgen islep shıǵarıwshılar', 'Frontend qániygeleri'],
    modules: [
      {
        title: 'React tiykarlari',
        description: 'Komponentlik oylaw hám JSX.',
        lessons: [
          {
            title: 'React nege kerek',
            slug: 'react-nege-kerek',
            type: 'VIDEO',
            durationMinutes: 13,
            isPreview: true,
            description: 'Komponentlik yondashıw hám React tiń tiykarǵı ideyası.',
          },
          {
            title: 'JSX ham komponentler',
            slug: 'jsx-komponentler',
            type: 'VIDEO',
            durationMinutes: 21,
            description: 'Birinshi komponentti jazıw hám JSX sintaksisi.',
          },
          {
            title: 'Props arqali maglimat beriw',
            slug: 'props',
            type: 'VIDEO',
            durationMinutes: 18,
            description: 'Komponentler arasında maǵlıwmat alısıw.',
          },
          {
            title: 'Dizimlerdi korsetiw',
            slug: 'dizimler',
            type: 'VIDEO',
            durationMinutes: 16,
            description: 'map arqalı dizim shıǵarıw hám `key` nege kerek.',
          },
        ],
      },
      {
        title: 'Holat ham hooks',
        description: 'Qollanbanıń ózgeriwshi bólegin basqarıw.',
        lessons: [
          {
            title: 'useState',
            slug: 'usestate',
            type: 'VIDEO',
            durationMinutes: 22,
            description: 'Komponenttiń ishki holatın saqlaw hám ózgertiw.',
          },
          {
            title: 'useEffect',
            slug: 'useeffect',
            type: 'VIDEO',
            durationMinutes: 26,
            description: 'Sırtqı sistemalar menen sinxronlastırıw.',
          },
          {
            title: 'Formalar menen islew',
            slug: 'formalar',
            type: 'VIDEO',
            durationMinutes: 24,
            description: 'Kontrollanatuǵın inputlar hám validaciya.',
          },
          {
            title: 'Oz hooks ti jaratiw',
            slug: 'oz-hooks',
            type: 'VIDEO',
            durationMinutes: 20,
            description: 'Logikanı qayta paydalanıw ushın custom hook jazıw.',
          },
        ],
      },
      {
        title: 'Ameliy joybar',
        description: 'Tolıq React qollanbasın jaratamız.',
        lessons: [
          {
            title: 'Joybar dizilisi ham routing',
            slug: 'joybar-dizilisi',
            type: 'VIDEO',
            durationMinutes: 23,
            description: 'Papkalar dúzilisi hám React Router sazlaw.',
          },
          {
            title: 'API menen integraciya',
            slug: 'api-integraciya',
            type: 'VIDEO',
            durationMinutes: 29,
            description: 'Serverden maǵlıwmat alıw, loading hám error halatları.',
          },
          {
            title: 'Joybardi jaylastiriw',
            slug: 'react-jaylastiriw',
            type: 'ARTICLE',
            durationMinutes: 12,
            description: 'Build jasaw hám hostingke júklew.',
            content:
              '## Build hám jaylastırıw\n\n' +
              '```bash\n' +
              'npm run build\n' +
              '```\n\n' +
              'Bul buyrıq `dist/` papkasında statikalıq fayllardı jaratadı. ' +
              'Sol papkanı qálegen statikalıq hostingke júklewińiz múmkin.\n\n' +
              '### Keń qollanılatuǵın variantlar\n\n' +
              '- **Vercel** — Git penen baylanıstırıp, avtomat jaylastırıw\n' +
              '- **Netlify** — drag-and-drop yamasa Git\n' +
              '- **GitHub Pages** — biypul, statikalıq saytlar ushın\n',
          },
        ],
      },
    ],
  },

  {
    slug: 'nodejs-backend-islep-shigariw',
    title: 'Node.js ham Express: backend islep shigariw',
    summary:
      'Server tárepinde REST API jaratıw, maǵlıwmatlar bazası menen islew hám autentifikaciya.',
    description:
      'Bul kurs server tárepindegi islep shıǵarıwǵa arnalǵan. Node.js hám Express ' +
      'járdeminde REST API jaratasız, PostgreSQL penen islewdi úyrenesiz hám ' +
      'paydalanıwshılardı qáwipsiz autentifikaciyalawdı ámelge asırasız.',
    categorySlug: 'backend',
    instructor: 'azamat',
    level: 'INTERMEDIATE',
    priceUzs: 690_000,
    objectives: [
      'Node.js hám Express penen server jaratıw',
      'REST API dizaynı hám marshrutlaw',
      'PostgreSQL penen islew hám migraciyalar',
      'JWT arqalı autentifikaciya hám avtorizaciya',
      'Qátelerdi basqarıw hám logirovaniye',
    ],
    prerequisites: ['JavaScript boyınsha isenimli bilim', 'Terminal menen islew'],
    targetAudience: ['Backend úyrenejaq bolǵanlar', 'Frontend islep shıǵarıwshılar'],
    modules: [
      {
        title: 'Node.js tiykarlari',
        description: 'Server tárepindegi JavaScript.',
        lessons: [
          {
            title: 'Node.js penen tanisiw',
            slug: 'nodejs-tanisiw',
            type: 'VIDEO',
            durationMinutes: 15,
            isPreview: true,
            description: 'Node.js qalay isleydi hám npm ekosistemasi.',
          },
          {
            title: 'Modullar ham npm',
            slug: 'modullar-npm',
            type: 'VIDEO',
            durationMinutes: 19,
            description: 'Paketler menen islew hám óz modulıńızdı jaratıw.',
          },
          {
            title: 'Fayllar ham aqimlar menen islew',
            slug: 'fayllar',
            type: 'VIDEO',
            durationMinutes: 21,
            description: 'fs modulı hám aǵımlar (streams).',
          },
        ],
      },
      {
        title: 'Express ham REST API',
        description: 'HTTP server hám marshrutlar.',
        lessons: [
          {
            title: 'Birinshi Express serveri',
            slug: 'express-server',
            type: 'VIDEO',
            durationMinutes: 18,
            description: 'Server kóteriw hám birinshi marshruttı jazıw.',
          },
          {
            title: 'Marshrutlar ham middleware',
            slug: 'marshrutlar-middleware',
            type: 'VIDEO',
            durationMinutes: 24,
            description: 'Marshrut dúzilisi hám middleware zanjiri.',
          },
          {
            title: 'REST API dizayni',
            slug: 'rest-dizayn',
            type: 'ARTICLE',
            durationMinutes: 16,
            description: 'Resurslar, HTTP metodları hám status kodları.',
            content:
              '## REST tiykarǵi qagiydalari\n\n' +
              '| Metod | Maqseti | Mısal |\n' +
              '| --- | --- | --- |\n' +
              '| GET | Oqıw | `GET /api/v1/courses` |\n' +
              '| POST | Jaratıw | `POST /api/v1/courses` |\n' +
              '| PATCH | Bólekley ózgertiw | `PATCH /api/v1/courses/:id` |\n' +
              '| DELETE | Óshiriw | `DELETE /api/v1/courses/:id` |\n\n' +
              '### Status kodlari\n\n' +
              '- `200` — támam boldı\n' +
              '- `201` — jaratıldı\n' +
              '- `400` — soraw qáte\n' +
              '- `401` — autentifikaciya kerek\n' +
              '- `403` — huqıq jetispeydi\n' +
              '- `404` — tabılmadı\n' +
              '- `409` — qarama-qarsılıq\n' +
              '- `500` — serverdiń ishki qátesi\n',
          },
          {
            title: 'Validaciya ham qatelerdi basqariw',
            slug: 'validaciya-qateler',
            type: 'VIDEO',
            durationMinutes: 22,
            description: 'Kirgizilgen maǵlıwmattı tekseriw hám birdey qáte formatı.',
          },
        ],
      },
      {
        title: 'Maglimatlar bazasi ham autentifikaciya',
        description: 'PostgreSQL hám qáwipsizlik.',
        lessons: [
          {
            title: 'PostgreSQL penen baylanis',
            slug: 'postgresql-baylanis',
            type: 'VIDEO',
            durationMinutes: 20,
            description: 'Baza jaratıw, kesteler hám tiykarǵı SQL sorawları.',
          },
          {
            title: 'ORM ham migraciyalar',
            slug: 'orm-migraciyalar',
            type: 'VIDEO',
            durationMinutes: 26,
            description: 'Sxemanı kod arqalı basqarıw hám migraciya jazıw.',
          },
          {
            title: 'Parollerdi qawipsiz saqlaw',
            slug: 'parol-qawipsizlik',
            type: 'VIDEO',
            durationMinutes: 18,
            description: 'Heshlew (bcrypt) hám nege shifrlaw emes.',
          },
          {
            title: 'JWT arqali autentifikaciya',
            slug: 'jwt-autentifikaciya',
            type: 'VIDEO',
            durationMinutes: 28,
            description: 'Token jaratıw, tekseriw hám refresh strategiyası.',
          },
        ],
      },
    ],
  },

  {
    slug: 'python-tiykarlardan-ameliyatqa',
    title: 'Python programmalastiriw: tiykarlardan ameliyatqa',
    summary:
      'Python tilin nolden iyeleń hám ámeliy avtomatlastırıw joybarların islep shıǵıń.',
    description:
      'Python — úyreniwge eń ańsat hám eń keń qollanılatuǵın tillerden biri. Bul kursta ' +
      'tildiń tiykarların, maǵlıwmat strukturaların hám ámeliy joybarlardı úyrenesiz. ' +
      'Kurs aqırında fayllar menen islew hám veb-skraping joybarların islep shıǵasız.',
    categorySlug: 'python',
    instructor: 'dilnaza',
    level: 'BEGINNER',
    priceUzs: 450_000,
    comparePriceUzs: 590_000,
    objectives: [
      'Python sintaksisin hám tiykarǵı tiplerdi iyelew',
      'Dizim, slovar hám kortejler menen islew',
      'Funkciya hám klasslardı dúziw',
      'Fayllar hám CSV menen islew',
      'Kishi avtomatlastırıw skriptlerin jazıw',
    ],
    prerequisites: ['Kompyuterde islew kónlikpesi'],
    targetAudience: ['Baslawshılar', 'Studentler', 'Analitika úyrenejaq bolǵanlar'],
    modules: [
      {
        title: 'Til tiykarlari',
        description: 'Sintaksis hám tiykarǵı túsinikler.',
        lessons: [
          {
            title: 'Python ornatiw ham birinshi programma',
            slug: 'python-ornatiw',
            type: 'VIDEO',
            durationMinutes: 14,
            isPreview: true,
            description: 'Ortalıq sazlaw hám `print` penen birinshi qádem.',
          },
          {
            title: 'Ozgeriwshiler ham tipler',
            slug: 'python-ozgeriwshiler',
            type: 'VIDEO',
            durationMinutes: 20,
            description: 'int, float, str, bool hám tiplerdi ózgertiw.',
          },
          {
            title: 'Shartlar ham cikller',
            slug: 'python-shartlar',
            type: 'VIDEO',
            durationMinutes: 22,
            description: 'if/elif/else, for hám while.',
          },
          {
            title: 'Funkciyalar',
            slug: 'python-funkciyalar',
            type: 'VIDEO',
            durationMinutes: 21,
            description: 'Funkciya dúziw, argumentler hám qaytarıw mánisi.',
          },
        ],
      },
      {
        title: 'Maglimat strukturalari',
        description: 'Maǵlıwmattı sáwlelendiriw usılları.',
        lessons: [
          {
            title: 'Dizimler ham kortejler',
            slug: 'dizimler-kortejler',
            type: 'VIDEO',
            durationMinutes: 23,
            description: 'list hám tuple penen islew usılları.',
          },
          {
            title: 'Slovarlar ham jiyinlar',
            slug: 'slovarlar',
            type: 'VIDEO',
            durationMinutes: 21,
            description: 'dict hám set: tez izlew hám biykarlanıwdı joq etiw.',
          },
          {
            title: 'Comprehension',
            slug: 'comprehension',
            type: 'VIDEO',
            durationMinutes: 17,
            description: 'Qısqa hám oqıwǵa ańsat dizim dúziw usılı.',
          },
        ],
      },
      {
        title: 'Ameliy joybarlar',
        description: 'Úyrengenlerdi islep kóremiz.',
        lessons: [
          {
            title: 'Fayllar ham CSV menen islew',
            slug: 'fayllar-csv',
            type: 'VIDEO',
            durationMinutes: 24,
            description: 'Oqıw, jazıw hám kesteli maǵlıwmattı qayta islew.',
          },
          {
            title: 'Joybar: magliwmatlardi tazalaw skripti',
            slug: 'joybar-tazalaw',
            type: 'VIDEO',
            durationMinutes: 32,
            description: 'Shın maǵlıwmat faylın tazalaytuǵın skript jazamız.',
          },
          {
            title: 'Modul boyinsha test',
            slug: 'python-test',
            type: 'QUIZ',
            durationMinutes: 9,
            description: 'Python tiykarları boyınsha test.',
            quiz: {
              title: 'Python tiykarlari testi',
              description: 'Úsh soraw. Ótiw ushın 60% kerek.',
              passingScore: 60,
              questions: [
                {
                  prompt: 'Qaysı tip ózgertilmeytuǵın (immutable)?',
                  explanation: 'tuple jaratılǵannan keyin ózgertilmeydi.',
                  options: [
                    { text: 'list' },
                    { text: 'dict' },
                    { text: 'tuple', isCorrect: true },
                    { text: 'set' },
                  ],
                },
                {
                  prompt: '`len([1, 2, 3])` neni qaytaradı?',
                  explanation: 'len dizimdegi elementler sanın qaytaradı.',
                  options: [
                    { text: '2' },
                    { text: '3', isCorrect: true },
                    { text: '6' },
                    { text: 'Qáte beredi' },
                  ],
                },
                {
                  prompt: 'Slovardan máni alıwdıń qáwipsiz usılı qaysı?',
                  explanation:
                    '`.get()` kalit bolmasa qáte bermeydi, ornına None (yamasa berilgen ' +
                    'standart mánis) qaytaradı.',
                  options: [
                    { text: 'd[key]' },
                    { text: 'd.get(key)', isCorrect: true },
                    { text: 'd.find(key)' },
                    { text: 'd.at(key)' },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },

  {
    slug: 'jasalma-intellekt-tiykarlari',
    title: 'Jasalma intellekt tiykarlari: mashina uyreniwi',
    summary:
      'Mashina úyreniwiniń tiykarǵı usılların Python hám scikit-learn penen ámeliyatta iyeleń.',
    description:
      'Bul kurs mashina úyreniwine kirisiw bolıp, matematikalıq tiykarlardı ańsat tilde ' +
      'túsindiredi hám hár bir usıldı ámeliy mısalda kórsetedi. Siz model oqıtıwdı, ' +
      'onıń sapasın bahalawdı hám tipik qátelerden saqlanıwdı úyrenesiz.',
    categorySlug: 'jasalma-intellekt',
    instructor: 'dilnaza',
    level: 'INTERMEDIATE',
    priceUzs: 890_000,
    comparePriceUzs: 1_190_000,
    objectives: [
      'Baqlawlı hám baqlawsız úyreniwdiń parqın túsiniw',
      'Regressiya hám klassifikaciya modellerin dúziw',
      'Modeldiń sapasın durıs bahalaw',
      'Overfitting hám underfitting ti anıqlaw',
      'Maǵlıwmattı modelge tayarlaw',
    ],
    prerequisites: ['Python boyınsha tiykarǵı bilim', 'Mektep dárejesindegi matematika'],
    targetAudience: ['Python bilgenler', 'Data analitikler', 'Studentler'],
    modules: [
      {
        title: 'Kirisiw',
        description: 'Mashina úyreniwi degen ne.',
        lessons: [
          {
            title: 'Mashina uyreniwi degen ne',
            slug: 'ml-degen-ne',
            type: 'VIDEO',
            durationMinutes: 16,
            isPreview: true,
            description: 'Tiykarǵı túsinikler hám ámeliy qollanıw tarawları.',
          },
          {
            title: 'Baqlawli ham baqlawsiz uyreniw',
            slug: 'baqlawli-baqlawsiz',
            type: 'VIDEO',
            durationMinutes: 18,
            description: 'Eki tiykarǵı yondashıwdıń parqı hám mısalları.',
          },
          {
            title: 'Ortaliqti sazlaw',
            slug: 'ml-ortaliq',
            type: 'VIDEO',
            durationMinutes: 13,
            description: 'NumPy, pandas hám scikit-learn ornatıw.',
          },
        ],
      },
      {
        title: 'Modeller',
        description: 'Tiykarǵı algoritmler.',
        lessons: [
          {
            title: 'Sizikli regressiya',
            slug: 'sizikli-regressiya',
            type: 'VIDEO',
            durationMinutes: 25,
            description: 'Sanlı mánisti aldın aytıw.',
          },
          {
            title: 'Logistikaliq regressiya',
            slug: 'logistikaliq-regressiya',
            type: 'VIDEO',
            durationMinutes: 23,
            description: 'Klassifikaciya mashqalaların sheshiw.',
          },
          {
            title: 'Sheshim agashlari',
            slug: 'sheshim-agashlari',
            type: 'VIDEO',
            durationMinutes: 24,
            description: 'Túsiniwge ańsat hám kúshli algoritm.',
          },
          {
            title: 'Klasterlew (k-means)',
            slug: 'klasterlew',
            type: 'VIDEO',
            durationMinutes: 20,
            description: 'Belgisiz gruppalardı tabıw.',
          },
        ],
      },
      {
        title: 'Bahalaw ham ameliyat',
        description: 'Model qanshelli jaqsı islegenin ólshew.',
        lessons: [
          {
            title: 'Train/test bolistiriw',
            slug: 'train-test',
            type: 'VIDEO',
            durationMinutes: 17,
            description: 'Nege maǵlıwmattı bóliw kerek hám qalay durıs bóliw.',
          },
          {
            title: 'Metrikalar: accuracy, precision, recall',
            slug: 'metrikalar',
            type: 'ARTICLE',
            durationMinutes: 19,
            description: 'Qaysı metrika qashan durıs kórsetkish boladı.',
            content:
              '## Nege tek accuracy jetkilikli emes\n\n' +
              'Eger maǵlıwmatlarda bir klass 99% bolsa, hámmesin sol klass dep aytatuǵın ' +
              'model 99% accuracy aladı — biraq ol paydasız.\n\n' +
              '### Tiykarǵi metrikalar\n\n' +
              '- **Accuracy** — ulıwma durıs juwaplar úlesi\n' +
              '- **Precision** — "pozitiv" dep aytılǵanlardıń qanshası shın pozitiv\n' +
              '- **Recall** — shın pozitivlerdiń qanshası tabıldı\n' +
              '- **F1** — precision hám recall arasındaǵı balans\n\n' +
              '> Medicina diagnostikasında recall, spam filtrinde precision ádette ' +
              'áhmiyetlirek boladı.',
          },
          {
            title: 'Overfitting ham onin aldin aliw',
            slug: 'overfitting',
            type: 'VIDEO',
            durationMinutes: 22,
            description: 'Model jattap qalsa ne boladı hám qalay tuwrılaw kerek.',
          },
        ],
      },
    ],
  },

  {
    slug: 'kiberqawipsizlik-tiykarlari',
    title: 'Kiberqawipsizlik tiykarlari',
    summary:
      'Veb-qollanbalardıń tipik qáwipsizlik tesiklerin hám olardan qorǵanıw usılların úyreniń.',
    description:
      'Bul kurs qáwipsizlik máselelerine ámeliy tárepten yondashadı. Siz keń tarqalǵan ' +
      'hújim túrlerin, olardıń qalay islewin hám qollanbanı qalay qorǵaw kerekligin ' +
      'úyrenesiz.\n\n' +
      'Kurs qorǵanıw (defensive) tárepke qaratılǵan: maqset — qáwipsiz sistema quraw.',
    categorySlug: 'kiberqawipsizlik',
    instructor: 'azamat',
    level: 'BEGINNER',
    priceUzs: 690_000,
    objectives: [
      'Tiykarǵı qáwipsizlik principlerin túsiniw',
      'OWASP Top 10 dizimindegi tesiklerdi tanıw',
      'Parol hám sessiya qáwipsizligin támiyinlew',
      'HTTPS, CORS hám tiykarǵı tarmaq qáwipsizligi',
      'Qáwipsizlik tekseriwin ámelge asırıw',
    ],
    prerequisites: ['Veb texnologiyaları boyınsha tiykarǵı bilim'],
    targetAudience: ['Islep shıǵarıwshılar', 'Sistema administratorları', 'Studentler'],
    modules: [
      {
        title: 'Tiykarlar',
        description: 'Qáwipsizlik oylawı.',
        lessons: [
          {
            title: 'Qawipsizlik principleri',
            slug: 'qawipsizlik-principleri',
            type: 'VIDEO',
            durationMinutes: 17,
            isPreview: true,
            description: 'Eń kem huqıq, qorǵanıw qatlamları hám isenimsizlik principi.',
          },
          {
            title: 'Autentifikaciya ham avtorizaciya',
            slug: 'auth-avtorizaciya',
            type: 'VIDEO',
            durationMinutes: 21,
            description: 'Kim ekenin tastıyıqlaw hám nege huqıqı bar ekenin tekseriw.',
          },
          {
            title: 'Parollerdi durıs saqlaw',
            slug: 'parollerdi-saqlaw',
            type: 'VIDEO',
            durationMinutes: 19,
            description: 'Heshlew, salt hám jumıs faktorı.',
          },
        ],
      },
      {
        title: 'Keń tarqalgan hujimler',
        description: 'Tipik tesikler hám qorǵanıw.',
        lessons: [
          {
            title: 'SQL injekciya',
            slug: 'sql-injekciya',
            type: 'VIDEO',
            durationMinutes: 23,
            description: 'Qalay payda boladı hám parametrlengen soraw penen qorǵanıw.',
          },
          {
            title: 'XSS (cross-site scripting)',
            slug: 'xss',
            type: 'VIDEO',
            durationMinutes: 22,
            description: 'Mazmunnı ekranlaw hám CSP sazlaw.',
          },
          {
            title: 'CSRF',
            slug: 'csrf',
            type: 'VIDEO',
            durationMinutes: 18,
            description: 'SameSite cookie hám token arqalı qorǵanıw.',
          },
          {
            title: 'Huqiqlardi tekseriwdegi qateler',
            slug: 'huqiq-qateleri',
            type: 'ARTICLE',
            durationMinutes: 16,
            description: 'Nege frontendte jasırıw qáwipsizlik emes.',
            content:
              '## Frontendte jasiriw — qawipsizlik emes\n\n' +
              'Eger admin siltemesi tek interfeyste jasırılsa, biraq server tárepinde ' +
              'tekseriw bolmasa, hár kim sol mánzilge tuwrıdan-tuwrı soraw jiberip ' +
              'kirip ketedi.\n\n' +
              '### Durıs yondashiw\n\n' +
              '1. Hár bir soraw server tárepinde tekseriledi.\n' +
              '2. Rol maǵlıwmatı tokennen alınadı, kliyenttiń sorawınan emes.\n' +
              '3. Standart halat — **biykarlaw**; ruxsat anıq beriledi.\n\n' +
              '```\n' +
              '// Nadurıs: kliyent óz rolin aytadı\n' +
              'POST /api/admin/courses  { role: "ADMIN", ... }\n' +
              '\n' +
              '// Durıs: rol serverde tokennen alınadı\n' +
              'POST /api/v1/admin/courses  (Authorization: Bearer ...)\n' +
              '```',
          },
        ],
      },
    ],
  },

  {
    slug: 'ui-ux-dizayn-tiykarlari',
    title: 'UI/UX dizayn: paydalaniwshi tajriybesi',
    summary:
      'Izertlewden prototipke shekem — qolaylı hám sulıw interfeysler dúziwdi úyreniń.',
    description:
      'Jaqsı dizayn — tek sulıwlıq emes, bálkim mashqalanı sheshiw. Bul kursta siz ' +
      'paydalanıwshını túsiniwdi, interfeys strukturasın dúziwdi hám Figma da prototip ' +
      'jaratıwdı úyrenesiz.',
    categorySlug: 'ui-ux-dizayn',
    instructor: 'gulnaz',
    level: 'BEGINNER',
    priceUzs: 590_000,
    comparePriceUzs: 790_000,
    objectives: [
      'Paydalanıwshı izertlewiniń tiykarǵı usılları',
      'Informaciya arxitekturasın dúziw',
      'Tipografiya, reń hám aralıq qaǵıydaları',
      'Figma da maket hám prototip jaratıw',
      'Dizayn sistemasın dúziw',
    ],
    prerequisites: ['Hesh qanday aldınǵı tájriybe talap etilmeydi'],
    targetAudience: ['Dizayn úyrenejaq bolǵanlar', 'Islep shıǵarıwshılar', 'Marketologlar'],
    modules: [
      {
        title: 'UX tiykarlari',
        description: 'Paydalanıwshını túsiniw.',
        lessons: [
          {
            title: 'UX ham UI parqi',
            slug: 'ux-ui-parqi',
            type: 'VIDEO',
            durationMinutes: 14,
            isPreview: true,
            description: 'Eki túsinik qalay baylanıslı hám nede parq etedi.',
          },
          {
            title: 'Paydalaniwshi izertlewi',
            slug: 'paydalaniwshi-izertlewi',
            type: 'VIDEO',
            durationMinutes: 20,
            description: 'Sáwbet, soraw-juwap hám gúzetiw usılları.',
          },
          {
            title: 'Personalar ham paydalaniwshi joli',
            slug: 'personalar',
            type: 'VIDEO',
            durationMinutes: 18,
            description: 'Maqsetli auditoriyanı sáwlelendiriw.',
          },
        ],
      },
      {
        title: 'Vizual dizayn',
        description: 'Kóriniske juwapker elementler.',
        lessons: [
          {
            title: 'Tipografiya',
            slug: 'tipografiya',
            type: 'VIDEO',
            durationMinutes: 22,
            description: 'Shrift saylaw, ólshem shkalası hám oqıwǵa ańsatlıq.',
          },
          {
            title: 'Ren ham kontrast',
            slug: 'ren-kontrast',
            type: 'VIDEO',
            durationMinutes: 21,
            description: 'Reń palitrası dúziw hám qolaylılıq talapları.',
          },
          {
            title: 'Jaylasiw ham aralıq',
            slug: 'jaylasiw-araliq',
            type: 'VIDEO',
            durationMinutes: 19,
            description: 'Setka (grid), ritm hám vizual ierarxiya.',
          },
        ],
      },
      {
        title: 'Figma da ameliyat',
        description: 'Quraldı iyelew hám joybar islew.',
        lessons: [
          {
            title: 'Figma tiykarlari',
            slug: 'figma-tiykarlari',
            type: 'VIDEO',
            durationMinutes: 24,
            description: 'Interfeys, qatlamlar hám komponentler.',
          },
          {
            title: 'Komponentler ham dizayn sistemasi',
            slug: 'dizayn-sistemasi',
            type: 'VIDEO',
            durationMinutes: 27,
            description: 'Qayta paydalanılatuǵın elementler hám stil kitapxanası.',
          },
          {
            title: 'Prototip jaratiw',
            slug: 'prototip',
            type: 'VIDEO',
            durationMinutes: 23,
            description: 'Interaktiv ótiwler hám testlew.',
          },
        ],
      },
    ],
  },

  {
    slug: 'flutter-mobil-qollanba',
    title: 'Flutter penen mobil qollanba jaratiw',
    summary:
      'Bir kod bazasınan Android hám iOS ushın qollanba islep shıǵarıwdı úyreniń.',
    description:
      'Flutter — bir kod jazıp, onı Android hám iOS ta islewge imkan beretuǵın framework. ' +
      'Bul kursta Dart tilin, Flutter widgetlerin hám ámeliy qollanba dúzilisin ' +
      'úyrenesiz.',
    categorySlug: 'mobil-islep-shigariw',
    instructor: 'aybek',
    level: 'INTERMEDIATE',
    priceUzs: 750_000,
    objectives: [
      'Dart tiliniń tiykarların iyelew',
      'Widget sistemasın túsiniw',
      'Holat basqarıw usılların qollanıw',
      'API menen islew hám jergilikli saqlaw',
      'Qollanbanı qurastırıw hám jaylastırıw',
    ],
    prerequisites: ['Qálegen programmalastırıw tilinde tiykarǵı bilim'],
    targetAudience: ['Mobil islep shıǵarıwshılar', 'Veb islep shıǵarıwshılar'],
    modules: [
      {
        title: 'Dart ham Flutter tiykarlari',
        description: 'Til hám framework penen tanısıw.',
        lessons: [
          {
            title: 'Ortaliqti sazlaw',
            slug: 'flutter-ortaliq',
            type: 'VIDEO',
            durationMinutes: 16,
            isPreview: true,
            description: 'Flutter SDK, emulyator hám redaktor sazlaw.',
          },
          {
            title: 'Dart tiykarlari',
            slug: 'dart-tiykarlari',
            type: 'VIDEO',
            durationMinutes: 25,
            description: 'Sintaksis, tipler hám klasslar.',
          },
          {
            title: 'Birinshi qollanba',
            slug: 'birinshi-qollanba',
            type: 'VIDEO',
            durationMinutes: 20,
            description: 'Proyekt dúzilisi hám `main.dart`.',
          },
        ],
      },
      {
        title: 'Widgetler ham interfeys',
        description: 'Ekrandı quraw.',
        lessons: [
          {
            title: 'Stateless ham Stateful widgetler',
            slug: 'widgetler',
            type: 'VIDEO',
            durationMinutes: 23,
            description: 'Eki tiykarǵı widget túri hám olardıń parqı.',
          },
          {
            title: 'Jaylastiriw widgetleri',
            slug: 'jaylastiriw-widgetleri',
            type: 'VIDEO',
            durationMinutes: 24,
            description: 'Row, Column, Stack hám Flex.',
          },
          {
            title: 'Dizimler ham navigaciya',
            slug: 'dizimler-navigaciya',
            type: 'VIDEO',
            durationMinutes: 22,
            description: 'ListView hám ekranlar arasında ótiw.',
          },
        ],
      },
      {
        title: 'Maglimat ham jaylastiriw',
        description: 'Qollanbanı tolıq etiw.',
        lessons: [
          {
            title: 'API menen islew',
            slug: 'flutter-api',
            type: 'VIDEO',
            durationMinutes: 26,
            description: 'HTTP sorawları hám JSON ti parse etiw.',
          },
          {
            title: 'Jergilikli saqlaw',
            slug: 'jergilikli-saqlaw',
            type: 'VIDEO',
            durationMinutes: 19,
            description: 'Maǵlıwmattı qurılmada saqlaw.',
          },
          {
            title: 'Qurastiriw ham jaylastiriw',
            slug: 'flutter-build',
            type: 'ARTICLE',
            durationMinutes: 15,
            description: 'APK/IPA jasaw hám doqanlarǵa shıǵarıw tártibi.',
            content:
              '## Qurastiriw\n\n' +
              '```bash\n' +
              '# Android\n' +
              'flutter build apk --release\n' +
              '\n' +
              '# iOS (macOS talap etiledi)\n' +
              'flutter build ipa --release\n' +
              '```\n\n' +
              '### Doqanlarga shigariw aldinan\n' +
              '\n' +
              '- Qollanba ikonkası hám atı\n' +
              '- Versiya nomeri (`pubspec.yaml`)\n' +
              '- Qol qoyıw (signing) sertifikatları\n' +
              '- Privacy policy siltemesi\n',
          },
        ],
      },
    ],
  },

  {
    slug: 'docker-cicd-devops',
    title: 'Docker ham CI/CD: DevOps tiykarlari',
    summary:
      'Konteynerler, avtomat jıynaw hám jaylastırıw qubılıslarını ámeliyatta iyeleń.',
    description:
      'DevOps — islep shıǵarıw hám ekspluataciya arasındaǵı kópir. Bul kursta Docker ' +
      'penen konteynerlestiriwdi, CI/CD quywırların dúziwdi hám joybardı bultta ' +
      'jaylastırıwdı úyrenesiz.',
    categorySlug: 'devops-bult',
    instructor: 'azamat',
    level: 'ADVANCED',
    priceUzs: 850_000,
    comparePriceUzs: 1_090_000,
    objectives: [
      'Docker image hám konteynerler menen islew',
      'docker compose penen kóp xizmetli ortalıq dúziw',
      'CI/CD quywırın dúziw',
      'Ortalıq ózgeriwshileri hám sırlardı basqarıw',
      'Monitoring hám loglardı jıynaw',
    ],
    prerequisites: ['Terminal menen isenimli islew', 'Bir veb-joybar islep shıǵarıw tájriybesi'],
    targetAudience: ['Backend islep shıǵarıwshılar', 'Sistema injenerleri'],
    modules: [
      {
        title: 'Docker',
        description: 'Konteynerlestiriw tiykarları.',
        lessons: [
          {
            title: 'Konteyner degen ne',
            slug: 'konteyner-degen-ne',
            type: 'VIDEO',
            durationMinutes: 18,
            isPreview: true,
            description: 'Virtual mashina hám konteyner arasındaǵı parq.',
          },
          {
            title: 'Dockerfile jaziw',
            slug: 'dockerfile',
            type: 'VIDEO',
            durationMinutes: 24,
            description: 'Qatlamlar, kesh hám image ólshemin kemeytiw.',
          },
          {
            title: 'docker compose',
            slug: 'docker-compose',
            type: 'VIDEO',
            durationMinutes: 22,
            description: 'Bir neshe xizmetti birge iske túsiriw.',
          },
          {
            title: 'Volume ham tarmaqlar',
            slug: 'volume-tarmaq',
            type: 'VIDEO',
            durationMinutes: 20,
            description: 'Maǵlıwmattı saqlaw hám konteynerler arasında baylanıs.',
          },
        ],
      },
      {
        title: 'CI/CD',
        description: 'Avtomatlastırıw.',
        lessons: [
          {
            title: 'CI/CD degen ne',
            slug: 'cicd-degen-ne',
            type: 'VIDEO',
            durationMinutes: 16,
            description: 'Úzliksiz integraciya hám jaylastırıw túsinikleri.',
          },
          {
            title: 'GitHub Actions penen quyvir duziw',
            slug: 'github-actions',
            type: 'VIDEO',
            durationMinutes: 28,
            description: 'Test, build hám deploy basqıshların jazıw.',
          },
          {
            title: 'Sirlardi basqariw',
            slug: 'sirlardi-basqariw',
            type: 'ARTICLE',
            durationMinutes: 14,
            description: 'Parollerdi hám kalitlardı qalay saqlaw kerek.',
            content:
              '## Sirlardi hesh qashan kodqa jazbań\n\n' +
              'Git tariyxı mángi. Bir mártebe kommit etilgen parol sol jerde qaladı, ' +
              'keyin óshirilse de.\n\n' +
              '### Durıs yondashiw\n\n' +
              '1. `.env` faylın `.gitignore` ǵa qosıń.\n' +
              '2. Repozitoriyda tek `.env.example` saqlanadı — ishinde tek ornı.\n' +
              '3. Shın mánisler CI/CD sırlar basqarıwshısında saqlanadı.\n' +
              '4. Sır kórinip qalsa, derhal onı jańalań (rotate).\n',
          },
        ],
      },
    ],
  },

  {
    slug: 'magliwmatlar-analitikasi-sql-python',
    title: 'Magliwmatlar analitikasi: SQL ham Python',
    summary:
      'Maǵlıwmatlardı jıynaw, tazalaw, analiz etiw hám vizuallastırıwdı ámeliyatta úyreniń.',
    description:
      'Bul kurs maǵlıwmatlar analitikasına ámeliy kirisiw. SQL arqalı maǵlıwmat alıwdı, ' +
      'pandas penen qayta islewdi hám nátiyjeni túsinikli grafiklerde kórsetiwdi ' +
      'úyrenesiz.',
    categorySlug: 'magliwmatlar-analitikasi',
    instructor: 'dilnaza',
    level: 'INTERMEDIATE',
    priceUzs: 650_000,
    objectives: [
      'SQL de quramalı sorawlar jazıw',
      'pandas penen maǵlıwmattı tazalaw hám ózgertiw',
      'Statistikalıq kórsetkishlerdi durıs talqılaw',
      'Grafikler arqalı nátiyjeni jetkeriw',
      'Analitikalıq esabat dúziw',
    ],
    prerequisites: ['Python boyınsha tiykarǵı bilim'],
    targetAudience: ['Analitikler', 'Marketologlar', 'Studentler'],
    modules: [
      {
        title: 'SQL',
        description: 'Maǵlıwmat bazasınan maǵlıwmat alıw.',
        lessons: [
          {
            title: 'SELECT ham filtrlew',
            slug: 'select-filtrlew',
            type: 'VIDEO',
            durationMinutes: 20,
            isPreview: true,
            description: 'Tiykarǵı sorawlar hám WHERE shártleri.',
          },
          {
            title: 'JOIN penen kestelerdi biriktiriw',
            slug: 'join',
            type: 'VIDEO',
            durationMinutes: 25,
            description: 'INNER, LEFT hám basqa biriktiriw túrleri.',
          },
          {
            title: 'Toparlaw ham agregaciya',
            slug: 'toparlaw-agregaciya',
            type: 'VIDEO',
            durationMinutes: 22,
            description: 'GROUP BY, HAVING hám agregat funkciyalar.',
          },
          {
            title: 'Window funkciyalari',
            slug: 'window-funkciyalari',
            type: 'VIDEO',
            durationMinutes: 24,
            description: 'Qatarlar boyınsha esaplawlar.',
          },
        ],
      },
      {
        title: 'pandas ham vizuallastiriw',
        description: 'Python penen analiz.',
        lessons: [
          {
            title: 'DataFrame tiykarlari',
            slug: 'dataframe',
            type: 'VIDEO',
            durationMinutes: 23,
            description: 'Maǵlıwmattı júklew, qaraw hám saylaw.',
          },
          {
            title: 'Magliwmatti tazalaw',
            slug: 'magliwmatti-tazalaw',
            type: 'VIDEO',
            durationMinutes: 26,
            description: 'Bos mánisler, dublikatlar hám tiplerdi tuwrılaw.',
          },
          {
            title: 'Grafikler duziw',
            slug: 'grafikler',
            type: 'VIDEO',
            durationMinutes: 21,
            description: 'Durıs grafik túrin saylaw hám oqıwǵa ańsat etiw.',
          },
          {
            title: 'Modul boyinsha test',
            slug: 'analitika-test',
            type: 'QUIZ',
            durationMinutes: 8,
            description: 'SQL hám pandas boyınsha test.',
            quiz: {
              title: 'Analitika testi',
              description: 'Úsh soraw. Ótiw ushın 60% kerek.',
              passingScore: 60,
              questions: [
                {
                  prompt: 'LEFT JOIN ne isleydi?',
                  explanation:
                    'Shep kestedegi barlıq qatarlardı saqlaydı, oń kestede sáykeslik ' +
                    'bolmasa NULL qoyadı.',
                  options: [
                    {
                      text: 'Shep kestedegi barlıq qatarlardı saqlaydı',
                      isCorrect: true,
                    },
                    { text: 'Tek sáykes keletuǵın qatarlardı qaytaradı' },
                    { text: 'Oń kestedegi barlıq qatarlardı saqlaydı' },
                    { text: 'Eki kestedegi barlıq kombinaciyalardı beredi' },
                  ],
                },
                {
                  prompt: 'GROUP BY dan keyin filtrlew ushın ne qollanıladı?',
                  explanation:
                    'WHERE toparlawǵa shekem, HAVING bolsa toparlawdan keyin isleydi.',
                  options: [
                    { text: 'WHERE' },
                    { text: 'HAVING', isCorrect: true },
                    { text: 'FILTER' },
                    { text: 'ORDER BY' },
                  ],
                },
                {
                  prompt: 'pandas ta bos mánislerdi tabıw ushın qaysı metod?',
                  explanation: '`isna()` (yamasa `isnull()`) bos mánislerdi belgileydi.',
                  options: [
                    { text: 'df.empty()' },
                    { text: 'df.isna()', isCorrect: true },
                    { text: 'df.none()' },
                    { text: 'df.missing()' },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  },

  {
    slug: 'unity-oyin-islep-shigariw',
    title: 'Unity penen oyin islep shigariw',
    summary: 'Unity hám C# járdeminde 2D hám 3D oyınlar jaratıwdı úyreniń.',
    description:
      'Unity — eń keń qollanılatuǵın oyın dvigateli. Bul kursta C# tilin, fizika ' +
      'sistemasın, animaciyanı hám oyın dizaynınıń tiykarǵı principlerin úyrenesiz. ' +
      'Kurs aqırında tolıq oynalatuǵın oyın islep shıǵasız.',
    categorySlug: 'oyin-islep-shigariw',
    instructor: 'aybek',
    level: 'INTERMEDIATE',
    priceUzs: 790_000,
    objectives: [
      'Unity interfeysin hám proyekt dúzilisin iyelew',
      'C# penen oyın logikasın jazıw',
      'Fizika hám soqlıǵısıwlar menen islew',
      'Animaciya hám dawıs qosıw',
      'Oyındı qurastırıp shıǵarıw',
    ],
    prerequisites: ['Programmalastırıw boyınsha tiykarǵı bilim'],
    targetAudience: ['Oyın islep shıǵarıwǵa qızıǵıwshılar', 'Studentler'],
    modules: [
      {
        title: 'Unity tiykarlari',
        description: 'Qural menen tanısıw.',
        lessons: [
          {
            title: 'Unity ornatiw ham interfeys',
            slug: 'unity-ornatiw',
            type: 'VIDEO',
            durationMinutes: 17,
            isPreview: true,
            description: 'Editor, Scene hám Inspector penen tanısıw.',
          },
          {
            title: 'GameObject ham komponentler',
            slug: 'gameobject',
            type: 'VIDEO',
            durationMinutes: 21,
            description: 'Obyektler hám olarǵa qosılatuǵın qásiyetler.',
          },
          {
            title: 'C# penen skript jaziw',
            slug: 'csharp-skript',
            type: 'VIDEO',
            durationMinutes: 26,
            description: 'MonoBehaviour, Start hám Update metodları.',
          },
        ],
      },
      {
        title: 'Oyin mexanikasi',
        description: 'Oyındı "tiri" etiw.',
        lessons: [
          {
            title: 'Fizika ham soqligisiwlar',
            slug: 'fizika',
            type: 'VIDEO',
            durationMinutes: 24,
            description: 'Rigidbody, Collider hám trigger.',
          },
          {
            title: 'Basqariw ham kamera',
            slug: 'basqariw-kamera',
            type: 'VIDEO',
            durationMinutes: 22,
            description: 'Kirgiziw (input) hám kameranı qadaǵalaw.',
          },
          {
            title: 'Animaciya ham dawis',
            slug: 'animaciya-dawis',
            type: 'VIDEO',
            durationMinutes: 23,
            description: 'Animator hám audio klipler menen islew.',
          },
          {
            title: 'Juwmaqlawshi joybar',
            slug: 'unity-joybar',
            type: 'VIDEO',
            durationMinutes: 40,
            description: 'Tolıq kishi oyın jaratıp, qurastırıp shıǵaramız.',
          },
        ],
      },
    ],
  },

  {
    slug: 'full-stack-nextjs-nestjs',
    title: 'Full-Stack islep shigariw: Next.js ham NestJS',
    summary:
      'Frontendten maǵlıwmatlar bazasına shekem tolıq veb-ónim islep shıǵarıwdı úyreniń.',
    description:
      'Bul — kurstıń eń keń kólemlisi. Siz Next.js penen frontend, NestJS penen backend ' +
      'hám PostgreSQL penen maǵlıwmat qatlamın quralıp, hámmesin bir ónimge ' +
      'birlestiresiz. Autentifikaciya, tólem, huqıqlar hám jaylastırıw da kiredi.\n\n' +
      'Bul kurs aldın JavaScript hám React boyınsha bilim talap etedi.',
    categorySlug: 'full-stack',
    instructor: 'azamat',
    level: 'ADVANCED',
    priceUzs: 1_290_000,
    comparePriceUzs: 1_690_000,
    objectives: [
      'Monorepo dúzilisin shólkemlestiriw',
      'Next.js App Router penen frontend quraw',
      'NestJS te REST API dúziw',
      'Prisma hám PostgreSQL penen maǵlıwmat qatlamın jaratıw',
      'Autentifikaciya, huqıqlar hám tólem integraciyası',
      'Joybardı produkciyaǵa jaylastırıw',
    ],
    prerequisites: [
      'JavaScript boyınsha isenimli bilim',
      'React tiykarları',
      'SQL boyınsha tiykarǵı túsinik',
    ],
    targetAudience: ['Tájriybeli frontend islep shıǵarıwshılar', 'Backend islep shıǵarıwshılar'],
    modules: [
      {
        title: 'Joybardi shölkemlestiriw',
        description: 'Tiykardı durıs qoyıw.',
        lessons: [
          {
            title: 'Monorepo ham struktura',
            slug: 'monorepo',
            type: 'VIDEO',
            durationMinutes: 22,
            isPreview: true,
            description: 'npm workspaces, ulıwma tipler hám validaciya paketleri.',
          },
          {
            title: 'TypeScript ti qatan sazlaw',
            slug: 'typescript-sazlaw',
            type: 'VIDEO',
            durationMinutes: 19,
            description: 'strict rejim hám ulıwma tsconfig.',
          },
        ],
      },
      {
        title: 'Backend (NestJS)',
        description: 'API hám maǵlıwmat qatlamı.',
        lessons: [
          {
            title: 'NestJS moduller ham DI',
            slug: 'nestjs-moduller',
            type: 'VIDEO',
            durationMinutes: 25,
            description: 'Modul, servis hám kontroller dúzilisi.',
          },
          {
            title: 'Prisma sxemasin dúziw',
            slug: 'prisma-sxema',
            type: 'VIDEO',
            durationMinutes: 28,
            description: 'Modeller, baylanıslar, indeksler hám migraciyalar.',
          },
          {
            title: 'Validaciya ham qate formati',
            slug: 'nestjs-validaciya',
            type: 'VIDEO',
            durationMinutes: 21,
            description: 'Zod penen bir qıylı validaciya hám qáte juwabı.',
          },
          {
            title: 'Autentifikaciya ham huqiqlar',
            slug: 'nestjs-auth',
            type: 'VIDEO',
            durationMinutes: 30,
            description: 'JWT, refresh token rotaciyası hám rol tekseriwi.',
          },
        ],
      },
      {
        title: 'Frontend (Next.js)',
        description: 'Paydalanıwshı interfeysi.',
        lessons: [
          {
            title: 'App Router ham server komponentler',
            slug: 'app-router',
            type: 'VIDEO',
            durationMinutes: 26,
            description: 'Server hám kliyent komponentleri arasındaǵı parq.',
          },
          {
            title: 'Maglimat alip keliw strategiyalari',
            slug: 'data-fetching',
            type: 'VIDEO',
            durationMinutes: 24,
            description: 'Keshlew, revalidaciya hám loading halatları.',
          },
          {
            title: 'Formalar ham validaciya',
            slug: 'nextjs-formalar',
            type: 'VIDEO',
            durationMinutes: 23,
            description: 'React Hook Form hám Zod penen bir qıylı tekseriw.',
          },
        ],
      },
      {
        title: 'Tolem ham jaylastiriw',
        description: 'Ónimdi iske tayarlaw.',
        lessons: [
          {
            title: 'Tolem integraciyasi',
            slug: 'tolem-integraciya',
            type: 'ARTICLE',
            durationMinutes: 20,
            description: 'Buyırtpa, tólem halatı hám webhook qáwipsizligi.',
            content:
              '## Tolem agimi\n\n' +
              '1. Kliyent tek **kurs id** larin jiberedi.\n' +
              '2. Server bahanı **bazadan** oqıp, buyırtpa jaratadı.\n' +
              '3. Tólem provayderine ótiw siltemesi beriledi.\n' +
              '4. Provayder webhook jiberedi — **qol qoyıw tekseriledi**.\n' +
              '5. Tek tastıyıqlanǵannan keyin kursqa jazılıw ashıladı.\n\n' +
              '> Hesh qashan kliyenttiń jibergen bahasına isenbeń. Baha — serverdiń ' +
              'maǵlıwmatı.\n\n' +
              '### Idempotentlik\n\n' +
              'Webhook bir neshe mártebe keliwi múmkin. Sol sebepli hár waqıya ' +
              '`externalEventId` boyınsha bir mártebe islenedi.',
          },
          {
            title: 'Produkciyaga jaylastiriw',
            slug: 'produkciya',
            type: 'VIDEO',
            durationMinutes: 27,
            description: 'Ortalıq ózgeriwshileri, migraciyalar hám monitoring.',
          },
        ],
      },
    ],
  },
];
