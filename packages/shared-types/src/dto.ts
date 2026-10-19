import type {
  CourseLevel,
  CourseStatus,
  EnrollmentStatus,
  LessonType,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  ProgressStatus,
  UserRole,
} from './enums';

/** Standard envelope for every paginated list endpoint. */
export interface Paginated<T> {
  items: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/** Shape of every error body the API returns. */
export interface ApiErrorBody {
  statusCode: number;
  /** Machine-readable code, e.g. "VALIDATION_FAILED", "COURSE_NOT_FOUND". */
  code: string;
  /** Human-readable message. Qaraqalpaq copy is resolved on the client. */
  message: string;
  /** Field-level validation errors, keyed by field path. */
  fields?: Record<string, string[]>;
  path: string;
  timestamp: string;
  requestId?: string;
}

export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl: string | null;
  headline: string | null;
  bio: string | null;
  createdAt: string;
}

/** Trimmed instructor view embedded in course payloads. */
export interface InstructorSummary {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  headline: string | null;
  bio: string | null;
}

export interface CategoryDto {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  /** Lucide icon name, resolved to a component on the client. */
  icon: string | null;
  /** Hex accent used for the category tile. */
  accent: string | null;
  position: number;
  courseCount: number;
}

export interface CourseListItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  thumbnailUrl: string | null;
  level: CourseLevel;
  /** Total duration of all published lessons, in minutes. */
  durationMinutes: number;
  lessonCount: number;
  /** Price in UZS so`m. 0 means the course is free. */
  priceUzs: number;
  /** Original price in UZS so`m when the course is discounted. */
  comparePriceUzs: number | null;
  isFree: boolean;
  language: string;
  /** Average of real published reviews, or null when there are none yet. */
  ratingAverage: number | null;
  ratingCount: number;
  enrollmentCount: number;
  category: Pick<CategoryDto, 'id' | 'slug' | 'name' | 'accent' | 'icon'>;
  instructor: InstructorSummary;
  publishedAt: string | null;
  createdAt: string;
}

export interface LessonSummary {
  id: string;
  slug: string;
  title: string;
  type: LessonType;
  durationMinutes: number;
  position: number;
  /** Lessons flagged as previews are watchable without enrolling. */
  isPreview: boolean;
  /** True when the caller may open this lesson's content. */
  isAccessible: boolean;
  hasQuiz: boolean;
}

export interface CourseModuleSummary {
  id: string;
  title: string;
  description: string | null;
  position: number;
  lessons: LessonSummary[];
  durationMinutes: number;
}

export interface ReviewDto {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: Pick<PublicUser, 'id' | 'fullName' | 'avatarUrl'>;
}

export interface CourseDetail extends CourseListItem {
  description: string;
  /** What the student will be able to do after the course. */
  objectives: string[];
  prerequisites: string[];
  targetAudience: string[];
  status: CourseStatus;
  modules: CourseModuleSummary[];
  reviews: ReviewDto[];
  /** Enrollment state of the calling user, null when not signed in. */
  viewerEnrollment: {
    id: string;
    status: EnrollmentStatus;
    progressPercent: number;
    lastLessonId: string | null;
  } | null;
  viewerHasReviewed: boolean;
  viewerSaved: boolean;
}

export interface LessonResource {
  id: string;
  title: string;
  url: string;
  sizeBytes: number | null;
  mimeType: string | null;
}

export interface LessonDetail {
  id: string;
  slug: string;
  title: string;
  type: LessonType;
  description: string | null;
  content: string | null;
  durationMinutes: number;
  position: number;
  isPreview: boolean;
  /**
   * Resolved playback descriptor. Null when the lesson is not a video or no
   * video provider is configured. Never contains a raw storage path.
   */
  video: {
    provider: string;
    /** Short-lived playback URL or provider playback id. */
    url: string | null;
    playbackId: string | null;
    expiresAt: string | null;
  } | null;
  resources: LessonResource[];
  moduleId: string;
  moduleTitle: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  progress: {
    status: ProgressStatus;
    completedAt: string | null;
    lastPositionSeconds: number;
    notes: string | null;
  } | null;
  quiz: QuizDto | null;
  prevLessonId: string | null;
  nextLessonId: string | null;
}

export interface QuizOptionDto {
  id: string;
  text: string;
  /** Only present once an attempt has been graded. */
  isCorrect?: boolean;
}

export interface QuizQuestionDto {
  id: string;
  prompt: string;
  explanation: string | null;
  position: number;
  points: number;
  options: QuizOptionDto[];
}

export interface QuizDto {
  id: string;
  title: string;
  description: string | null;
  passingScore: number;
  questions: QuizQuestionDto[];
  bestAttempt: {
    id: string;
    score: number;
    passed: boolean;
    submittedAt: string;
  } | null;
}

export interface QuizAttemptResult {
  id: string;
  score: number;
  maxScore: number;
  percent: number;
  passed: boolean;
  submittedAt: string;
  answers: {
    questionId: string;
    selectedOptionId: string | null;
    correctOptionId: string;
    isCorrect: boolean;
    explanation: string | null;
  }[];
}

export interface EnrollmentDto {
  id: string;
  status: EnrollmentStatus;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  enrolledAt: string;
  completedAt: string | null;
  lastAccessedAt: string | null;
  course: CourseListItem;
  /** Where "continue learning" should send the student. */
  nextLesson: {
    id: string;
    title: string;
    moduleTitle: string;
    courseSlug: string;
  } | null;
}

export interface OrderItemDto {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  thumbnailUrl: string | null;
  /** Price captured at purchase time, in UZS so`m. */
  unitPriceUzs: number;
}

export interface OrderDto {
  id: string;
  reference: string;
  status: OrderStatus;
  totalUzs: number;
  currency: string;
  createdAt: string;
  paidAt: string | null;
  items: OrderItemDto[];
  payment: {
    id: string;
    provider: PaymentProvider;
    status: PaymentStatus;
    /** URL the student must visit to complete payment, when applicable. */
    checkoutUrl: string | null;
    createdAt: string;
  } | null;
}

export interface CertificateDto {
  id: string;
  /** Public, unique verification code printed on the certificate. */
  verificationCode: string;
  issuedAt: string;
  courseTitle: string;
  courseSlug: string;
  recipientName: string;
  instructorName: string;
  durationMinutes: number;
}

export interface CertificateVerification {
  valid: boolean;
  certificate: CertificateDto | null;
}

/** Point in the "learning activity" chart on the student dashboard. */
export interface ActivityPoint {
  /** ISO date, day granularity. */
  date: string;
  completedLessons: number;
  minutes: number;
}

export interface DashboardSummary {
  user: PublicUser;
  stats: {
    activeCourses: number;
    completedCourses: number;
    completedLessons: number;
    totalLessons: number;
    certificates: number;
    /** Sum of durations of completed lessons, in minutes. */
    learnedMinutes: number;
    /** Consecutive days with at least one completed lesson. */
    streakDays: number;
  };
  /** Last 30 days of real recorded activity. May be all zeroes. */
  activity: ActivityPoint[];
  /** Completed-lesson counts grouped by category, for the donut chart. */
  categoryBreakdown: { categoryName: string; accent: string | null; lessons: number }[];
  continueLearning: EnrollmentDto[];
  recentActivity: {
    id: string;
    type: 'LESSON_COMPLETED' | 'COURSE_ENROLLED' | 'CERTIFICATE_ISSUED' | 'QUIZ_PASSED';
    title: string;
    courseTitle: string;
    courseSlug: string;
    at: string;
  }[];
}

export interface AdminOverview {
  totals: {
    users: number;
    students: number;
    instructors: number;
    courses: number;
    publishedCourses: number;
    draftCourses: number;
    categories: number;
    enrollments: number;
    certificates: number;
    paidOrders: number;
    revenueUzs: number;
  };
  /** Enrollments per day over the last 30 days. */
  enrollmentTrend: { date: string; count: number }[];
  /** Paid revenue per day over the last 30 days, in UZS so`m. */
  revenueTrend: { date: string; revenueUzs: number }[];
  topCourses: {
    id: string;
    title: string;
    slug: string;
    enrollments: number;
    revenueUzs: number;
  }[];
  recentOrders: OrderDto[];
}

export interface AuthSession {
  user: PublicUser;
  /** Access token lifetime in seconds, so the client can schedule refresh. */
  expiresIn: number;
}
