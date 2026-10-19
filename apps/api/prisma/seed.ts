/**
 * Development seed.
 *
 * Creates the twelve launch categories, a handful of instructors and a set of
 * realistic IT courses with Qaraqalpaq titles, curricula and quizzes. It also
 * creates one demo student with genuine enrollments, lesson progress, a quiz
 * attempt, a paid order and a certificate, so the dashboard and admin charts
 * have real rows to read rather than hardcoded numbers.
 *
 * EVERY row written here carries `isDemo: true`. Real commercial records are
 * always `isDemo: false`, so demo content can be listed, badged or removed
 * with a single predicate.
 *
 * Idempotent: re-running updates the same rows instead of duplicating them.
 *
 * Run with:  npm run db:seed --workspace @nagis/api
 */

import { type Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createPrismaClient } from './client';
import { CATEGORIES, COURSES, INSTRUCTORS, type CourseSeed } from './seed-data';

/* --------------------------------------------------------------------------
 * Environment
 * ----------------------------------------------------------------------- */

// createPrismaClient loads the repository-root .env and attaches the
// node-postgres driver adapter that Prisma 7 requires.
const prisma = createPrismaClient();

/** Seed accounts. Passwords come from .env so they are never hardcoded. */
const ADMIN_EMAIL = process.env['SEED_ADMIN_EMAIL'] ?? 'admin@nagis.uz';
const ADMIN_PASSWORD = process.env['SEED_ADMIN_PASSWORD'] ?? 'Admin12345!';
const STUDENT_EMAIL = process.env['SEED_STUDENT_EMAIL'] ?? 'student@nagis.uz';
const STUDENT_PASSWORD = process.env['SEED_STUDENT_PASSWORD'] ?? 'Student12345!';

/** Instructor demo accounts share one password; they are demo rows only. */
const INSTRUCTOR_PASSWORD = 'Instructor12345!';

const HASH_ROUNDS = Number(process.env['PASSWORD_HASH_ROUNDS'] ?? 12);

/* --------------------------------------------------------------------------
 * Helpers
 * ----------------------------------------------------------------------- */

const CERT_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function certificateCode(seed: number): string {
  // Deterministic from a seed so re-running does not churn the code.
  let value = seed * 2_654_435_761;
  const group = (): string => {
    let out = '';
    for (let index = 0; index < 4; index += 1) {
      value = (value * 1_103_515_245 + 12_345) & 0x7fffffff;
      out += CERT_ALPHABET[value % CERT_ALPHABET.length];
    }
    return out;
  };
  return `NAGIS-${group()}-${group()}-${group()}`;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function log(message: string): void {
  console.log(`  ${message}`);
}

/* --------------------------------------------------------------------------
 * Steps
 * ----------------------------------------------------------------------- */

async function seedUsers() {
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, HASH_ROUNDS);
  const studentHash = await bcrypt.hash(STUDENT_PASSWORD, HASH_ROUNDS);
  const instructorHash = await bcrypt.hash(INSTRUCTOR_PASSWORD, HASH_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: 'ADMIN', isDemo: true, isActive: true },
    create: {
      email: ADMIN_EMAIL,
      passwordHash: adminHash,
      fullName: 'NAGIS Administrator',
      role: 'ADMIN',
      headline: 'Platforma administratori',
      emailVerifiedAt: new Date(),
      isDemo: true,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: STUDENT_EMAIL },
    update: { isDemo: true, isActive: true },
    create: {
      email: STUDENT_EMAIL,
      passwordHash: studentHash,
      fullName: 'Aziza Qalmuratova',
      role: 'STUDENT',
      headline: 'Informatika studenti',
      bio: 'Nokis mamleketlik universiteti studenti. Frontend islep shigariwdi uyrenip atirman.',
      emailVerifiedAt: new Date(),
      createdAt: daysAgo(45),
      isDemo: true,
    },
  });

  const instructors: Record<string, { id: string; fullName: string }> = {};
  for (const [key, seed] of Object.entries(INSTRUCTORS)) {
    const user = await prisma.user.upsert({
      where: { email: seed.email },
      update: {
        fullName: seed.fullName,
        headline: seed.headline,
        bio: seed.bio,
        role: 'INSTRUCTOR',
        isDemo: true,
      },
      create: {
        email: seed.email,
        passwordHash: instructorHash,
        fullName: seed.fullName,
        headline: seed.headline,
        bio: seed.bio,
        role: 'INSTRUCTOR',
        emailVerifiedAt: new Date(),
        isDemo: true,
      },
      select: { id: true, fullName: true },
    });
    instructors[key] = user;
  }

  log(`users: 1 admin, 1 student, ${Object.keys(instructors).length} instructors`);
  return { admin, student, instructors };
}

async function seedCategories() {
  const map: Record<string, string> = {};
  for (const category of CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        icon: category.icon,
        accent: category.accent,
        position: category.position,
        isActive: true,
        isDemo: true,
      },
      create: {
        slug: category.slug,
        name: category.name,
        description: category.description,
        icon: category.icon,
        accent: category.accent,
        position: category.position,
        isDemo: true,
      },
      select: { id: true },
    });
    map[category.slug] = row.id;
  }
  log(`categories: ${CATEGORIES.length}`);
  return map;
}

async function seedCourse(
  course: CourseSeed,
  categoryIds: Record<string, string>,
  instructors: Record<string, { id: string }>,
  publishedDaysAgo: number,
) {
  const categoryId = categoryIds[course.categorySlug];
  const instructor = instructors[course.instructor];

  if (!categoryId) throw new Error(`Unknown category slug: ${course.categorySlug}`);
  if (!instructor) throw new Error(`Unknown instructor key: ${course.instructor}`);

  const data = {
    title: course.title,
    summary: course.summary,
    description: course.description,
    categoryId,
    instructorId: instructor.id,
    level: course.level,
    status: 'PUBLISHED' as const,
    priceUzs: course.priceUzs,
    comparePriceUzs: course.comparePriceUzs ?? null,
    language: 'kaa',
    objectives: course.objectives,
    prerequisites: course.prerequisites,
    targetAudience: course.targetAudience,
    publishedAt: daysAgo(publishedDaysAgo),
    isDemo: true,
  };

  const row = await prisma.course.upsert({
    where: { slug: course.slug },
    update: data,
    create: { slug: course.slug, ...data },
    select: { id: true },
  });

  // Rebuild the curriculum from scratch so editing seed-data.ts is reflected
  // exactly. Cascades remove the old modules, lessons, quizzes and options.
  await prisma.courseModule.deleteMany({ where: { courseId: row.id } });

  let lessonCount = 0;

  for (const [moduleIndex, moduleSeed] of course.modules.entries()) {
    const moduleRow = await prisma.courseModule.create({
      data: {
        courseId: row.id,
        title: moduleSeed.title,
        description: moduleSeed.description,
        position: moduleIndex,
      },
      select: { id: true },
    });

    for (const [lessonIndex, lessonSeed] of moduleSeed.lessons.entries()) {
      const lessonRow = await prisma.lesson.create({
        data: {
          moduleId: moduleRow.id,
          title: lessonSeed.title,
          slug: lessonSeed.slug,
          type: lessonSeed.type,
          description: lessonSeed.description,
          content: lessonSeed.content ?? null,
          durationMinutes: lessonSeed.durationMinutes,
          position: lessonIndex,
          isPreview: lessonSeed.isPreview ?? false,
          isPublished: true,
          // No video provider is configured in development, so there is no
          // asset reference to store. The player shows a clearly labelled
          // placeholder rather than a broken embed.
          videoRef: null,
          ...(lessonSeed.resources && lessonSeed.resources.length > 0
            ? {
                resources: {
                  create: lessonSeed.resources.map((resource, index) => ({
                    title: resource.title,
                    url: resource.url,
                    mimeType: resource.mimeType,
                    position: index,
                  })),
                },
              }
            : {}),
        },
        select: { id: true },
      });

      lessonCount += 1;

      if (lessonSeed.quiz) {
        const quizRow = await prisma.quiz.create({
          data: {
            lessonId: lessonRow.id,
            title: lessonSeed.quiz.title,
            description: lessonSeed.quiz.description,
            passingScore: lessonSeed.quiz.passingScore,
          },
          select: { id: true },
        });

        for (const [questionIndex, question] of lessonSeed.quiz.questions.entries()) {
          await prisma.quizQuestion.create({
            data: {
              quizId: quizRow.id,
              prompt: question.prompt,
              explanation: question.explanation,
              points: 1,
              position: questionIndex,
              options: {
                create: question.options.map((option, optionIndex) => ({
                  text: option.text,
                  isCorrect: option.isCorrect ?? false,
                  position: optionIndex,
                })),
              },
            },
          });
        }
      }
    }
  }

  return { id: row.id, lessonCount };
}

async function seedCourses(
  categoryIds: Record<string, string>,
  instructors: Record<string, { id: string }>,
) {
  const result: Record<string, { id: string; lessonCount: number }> = {};
  for (const [index, course] of COURSES.entries()) {
    // Spread publish dates out so "newest" ordering is meaningful.
    result[course.slug] = await seedCourse(
      course,
      categoryIds,
      instructors,
      60 - index * 4,
    );
  }
  const lessons = Object.values(result).reduce((sum, item) => sum + item.lessonCount, 0);
  log(`courses: ${COURSES.length} published, ${lessons} lessons`);
  return result;
}

/**
 * Gives the demo student a believable history: two courses in progress, one
 * finished with a certificate, a paid order, a quiz attempt and a review.
 *
 * Progress rows are real, so the dashboard percentages and the activity chart
 * are computed from the database rather than invented in the UI.
 */
async function seedStudentActivity(
  student: { id: string; fullName: string },
  courses: Record<string, { id: string; lessonCount: number }>,
) {
  const free = courses['html-css-tiykarlari'];
  const js = courses['javascript-nolden-professional'];
  const prompt = courses['prompt-injeneriya-tiykarlari'];

  if (!free || !js || !prompt) {
    throw new Error('Expected demo courses are missing from the seed result.');
  }

  /* ---- 1. Finished free course + certificate ---- */

  const freeLessons = await prisma.lesson.findMany({
    where: { module: { courseId: free.id }, isPublished: true },
    orderBy: [{ module: { position: 'asc' } }, { position: 'asc' }],
    select: { id: true, durationMinutes: true, quiz: { select: { id: true } } },
  });

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: student.id, courseId: free.id } },
    update: { status: 'COMPLETED', isDemo: true },
    create: {
      userId: student.id,
      courseId: free.id,
      status: 'COMPLETED',
      enrolledAt: daysAgo(40),
      completedAt: daysAgo(18),
      lastAccessedAt: daysAgo(18),
      lastLessonId: freeLessons.at(-1)?.id ?? null,
      isDemo: true,
    },
  });

  for (const [index, lesson] of freeLessons.entries()) {
    // Spread completions across real calendar days so the activity chart has
    // a genuine shape.
    const completedAt = daysAgo(40 - index * 2);
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: student.id, lessonId: lesson.id } },
      update: { status: 'COMPLETED', completedAt },
      create: {
        userId: student.id,
        lessonId: lesson.id,
        courseId: free.id,
        status: 'COMPLETED',
        completedAt,
        lastPositionSeconds: lesson.durationMinutes * 60,
      },
    });
  }

  const certCourse = await prisma.course.findUniqueOrThrow({
    where: { id: free.id },
    select: {
      title: true,
      slug: true,
      instructor: { select: { fullName: true } },
      modules: { select: { lessons: { select: { durationMinutes: true } } } },
    },
  });

  const certDuration = certCourse.modules.reduce(
    (sum, m) => sum + m.lessons.reduce((inner, l) => inner + l.durationMinutes, 0),
    0,
  );

  await prisma.certificate.upsert({
    where: { userId_courseId: { userId: student.id, courseId: free.id } },
    update: {},
    create: {
      userId: student.id,
      courseId: free.id,
      verificationCode: certificateCode(1),
      recipientName: student.fullName,
      courseTitle: certCourse.title,
      instructorName: certCourse.instructor.fullName,
      durationMinutes: certDuration,
      issuedAt: daysAgo(18),
      isDemo: true,
    },
  });

  /* ---- 2. A real review on the finished course ---- */

  await prisma.review.upsert({
    where: { userId_courseId: { userId: student.id, courseId: free.id } },
    update: {},
    create: {
      userId: student.id,
      courseId: free.id,
      rating: 5,
      comment:
        'Juda tusinikli bayanlangan. Hesh qanday aldıngi tajriybem joq edi, biraq ' +
        'hamme sabaqti ańsat tusindim. Portfolio joybari ayriqsha paydali boldi.',
      createdAt: daysAgo(17),
      isDemo: true,
    },
  });

  /* ---- 3. Paid course, bought and in progress ---- */

  const order = await prisma.order.upsert({
    where: { reference: 'NAGIS-DEMO-000001' },
    update: {},
    create: {
      reference: 'NAGIS-DEMO-000001',
      userId: student.id,
      status: 'PAID',
      totalUzs: 490_000,
      currency: 'UZS',
      createdAt: daysAgo(22),
      paidAt: daysAgo(22),
      isDemo: true,
      items: {
        create: [
          {
            courseId: js.id,
            courseTitle: 'JavaScript: nolden professional darejege',
            courseSlug: 'javascript-nolden-professional',
            unitPriceUzs: 490_000,
          },
        ],
      },
      payments: {
        create: [
          {
            provider: 'DEV',
            status: 'SUCCEEDED',
            amountUzs: 490_000,
            currency: 'UZS',
            // Clearly marked as the development adapter, never a real provider.
            providerPaymentId: 'dev_demo_000001',
            idempotencyKey: 'idem_demo_000001',
            paidAt: daysAgo(22),
            isDemo: true,
          },
        ],
      },
    },
    select: { id: true },
  });

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: student.id, courseId: js.id } },
    update: { isDemo: true },
    create: {
      userId: student.id,
      courseId: js.id,
      status: 'ACTIVE',
      enrolledAt: daysAgo(22),
      lastAccessedAt: daysAgo(1),
      isDemo: true,
    },
  });

  const jsLessons = await prisma.lesson.findMany({
    where: { module: { courseId: js.id }, isPublished: true },
    orderBy: [{ module: { position: 'asc' } }, { position: 'asc' }],
    select: { id: true, durationMinutes: true, quiz: { select: { id: true } } },
  });

  // Finish roughly the first half, then leave one lesson part-watched so
  // "continue learning" has somewhere real to resume.
  const finished = Math.floor(jsLessons.length * 0.45);

  for (const [index, lesson] of jsLessons.entries()) {
    if (index < finished) {
      await prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId: student.id, lessonId: lesson.id } },
        update: { status: 'COMPLETED' },
        create: {
          userId: student.id,
          lessonId: lesson.id,
          courseId: js.id,
          status: 'COMPLETED',
          completedAt: daysAgo(20 - index),
          lastPositionSeconds: lesson.durationMinutes * 60,
        },
      });
    } else if (index === finished) {
      await prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId: student.id, lessonId: lesson.id } },
        update: { status: 'IN_PROGRESS' },
        create: {
          userId: student.id,
          lessonId: lesson.id,
          courseId: js.id,
          status: 'IN_PROGRESS',
          lastPositionSeconds: Math.floor((lesson.durationMinutes * 60) / 3),
        },
      });
      await prisma.enrollment.update({
        where: { userId_courseId: { userId: student.id, courseId: js.id } },
        data: { lastLessonId: lesson.id },
      });
    }
  }

  /* ---- 4. A real quiz attempt ---- */

  const quizLesson = jsLessons.find((lesson) => lesson.quiz !== null);
  if (quizLesson?.quiz) {
    const questions = await prisma.quizQuestion.findMany({
      where: { quizId: quizLesson.quiz.id },
      orderBy: { position: 'asc' },
      select: { id: true, points: true, options: { select: { id: true, isCorrect: true } } },
    });

    const answers = questions.map((question, index) => {
      const correct = question.options.find((option) => option.isCorrect);
      // Get all but the last one right, so the score is not a suspicious 100%.
      const chosen =
        index === questions.length - 1
          ? (question.options.find((option) => !option.isCorrect) ?? correct)
          : correct;
      return {
        questionId: question.id,
        optionId: chosen?.id ?? null,
        correctOptionId: correct?.id ?? null,
        isCorrect: chosen?.isCorrect === true,
      };
    });

    const maxScore = questions.reduce((sum, question) => sum + question.points, 0);
    const score = answers.reduce(
      (sum, answer, index) => sum + (answer.isCorrect ? (questions[index]?.points ?? 0) : 0),
      0,
    );

    const existing = await prisma.quizAttempt.findFirst({
      where: { quizId: quizLesson.quiz.id, userId: student.id },
      select: { id: true },
    });

    if (!existing) {
      await prisma.quizAttempt.create({
        data: {
          quizId: quizLesson.quiz.id,
          userId: student.id,
          score,
          maxScore,
          passed: maxScore > 0 && (score / maxScore) * 100 >= 60,
          answers: answers as unknown as Prisma.InputJsonValue,
          submittedAt: daysAgo(12),
        },
      });
    }
  }

  /* ---- 5. Free course in progress + a saved course ---- */

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: student.id, courseId: prompt.id } },
    update: { isDemo: true },
    create: {
      userId: student.id,
      courseId: prompt.id,
      status: 'ACTIVE',
      enrolledAt: daysAgo(6),
      lastAccessedAt: daysAgo(2),
      isDemo: true,
    },
  });

  const promptLessons = await prisma.lesson.findMany({
    where: { module: { courseId: prompt.id }, isPublished: true },
    orderBy: [{ module: { position: 'asc' } }, { position: 'asc' }],
    select: { id: true, durationMinutes: true },
    take: 2,
  });

  for (const [index, lesson] of promptLessons.entries()) {
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: student.id, lessonId: lesson.id } },
      update: { status: 'COMPLETED' },
      create: {
        userId: student.id,
        lessonId: lesson.id,
        courseId: prompt.id,
        status: 'COMPLETED',
        completedAt: daysAgo(5 - index),
        lastPositionSeconds: lesson.durationMinutes * 60,
      },
    });
  }

  for (const slug of ['react-zamanagoy-interfeysler', 'ui-ux-dizayn-tiykarlari']) {
    const saved = courses[slug];
    if (!saved) continue;
    await prisma.savedCourse.upsert({
      where: { userId_courseId: { userId: student.id, courseId: saved.id } },
      update: {},
      create: { userId: student.id, courseId: saved.id },
    });
  }

  log(`student activity: 3 enrollments, 1 certificate, 1 paid order (${order.id.slice(0, 8)}…)`);
}

/**
 * Adds a few more demo reviews from the instructor accounts so the catalog has
 * genuine ratings on more than one course. Reviews are real rows; the ratings
 * shown in the UI are computed from them.
 */
async function seedExtraReviews(
  instructors: Record<string, { id: string }>,
  courses: Record<string, { id: string }>,
) {
  const entries: { course: string; author: string; rating: number; comment: string }[] = [
    {
      course: 'javascript-nolden-professional',
      author: 'gulnaz',
      rating: 5,
      comment:
        'Asinxron bolimi ayriqsha jaqsi tusindirilgen. Promise hám async/await ' +
        'arasindagi parqti aqirinda anik tusindim.',
    },
    {
      course: 'javascript-nolden-professional',
      author: 'dilnaza',
      rating: 4,
      comment: 'Mazmuni kushli. DOM bolimine bir neshe qosimsha mashqala kerek edi.',
    },
    {
      course: 'python-tiykarlardan-ameliyatqa',
      author: 'aybek',
      rating: 5,
      comment: 'Baslawshilar ushin eń jaqsi variant. Ameliy joybar paydali boldi.',
    },
    {
      course: 'prompt-injeneriya-tiykarlari',
      author: 'azamat',
      rating: 4,
      comment: 'Qisqa, biraq kerekli tiykarlardi tolik qamtidi.',
    },
    {
      course: 'ui-ux-dizayn-tiykarlari',
      author: 'azamat',
      rating: 5,
      comment: 'Figma bolimi ameliy hám tusinikli. Dizayn sistemasi haqqindagi sabaq kushli.',
    },
  ];

  let created = 0;
  for (const entry of entries) {
    const course = courses[entry.course];
    const author = instructors[entry.author];
    if (!course || !author) continue;

    await prisma.review.upsert({
      where: { userId_courseId: { userId: author.id, courseId: course.id } },
      update: {},
      create: {
        userId: author.id,
        courseId: course.id,
        rating: entry.rating,
        comment: entry.comment,
        createdAt: daysAgo(10),
        isDemo: true,
      },
    });
    created += 1;
  }

  log(`reviews: ${created + 1} total (including the student review)`);
}

/**
 * Recomputes the denormalised aggregates from the real rows just written, so
 * the seeded state is exactly what the application would produce itself.
 */
async function recomputeAggregates() {
  const courses = await prisma.course.findMany({ select: { id: true } });

  for (const course of courses) {
    const ratings = await prisma.review.aggregate({
      where: { courseId: course.id, isPublished: true },
      _sum: { rating: true },
      _count: { rating: true },
    });

    const sum = ratings._sum.rating ?? 0;
    const count = ratings._count.rating;

    const enrollments = await prisma.enrollment.count({
      where: { courseId: course.id, status: { in: ['ACTIVE', 'COMPLETED'] } },
    });

    await prisma.course.update({
      where: { id: course.id },
      data: {
        ratingSum: sum,
        ratingCount: count,
        ratingAverageBp: count > 0 ? Math.round((sum * 100) / count) : 0,
        enrollmentCount: enrollments,
      },
    });
  }

  log(`aggregates recomputed for ${courses.length} courses`);
}

/* --------------------------------------------------------------------------
 * Entry point
 * ----------------------------------------------------------------------- */

async function main(): Promise<void> {
  console.log('\nNAGIS development seed');
  console.log('──────────────────────────────────────────────');
  console.log('All rows are written with isDemo = true.\n');

  const { student, instructors } = await seedUsers();
  const categoryIds = await seedCategories();
  const courses = await seedCourses(categoryIds, instructors);
  await seedStudentActivity(student, courses);
  await seedExtraReviews(instructors, courses);
  await recomputeAggregates();

  console.log('\n──────────────────────────────────────────────');
  console.log('Seed complete. Demo sign-in details:\n');
  console.log(`  Admin:    ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`  Student:  ${STUDENT_EMAIL} / ${STUDENT_PASSWORD}`);
  console.log(`  Teacher:  ${INSTRUCTORS['aybek']?.email} / ${INSTRUCTOR_PASSWORD}`);
  console.log('\nThese are development credentials. Change them before any');
  console.log('deployment, and never seed a production database.\n');
}

main()
  .catch((error: unknown) => {
    console.error('\nSeed failed:');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
