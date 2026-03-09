export type ApiResponse<T> = {
  data: T;
};

export type User = {
  id: number;
  name: string;
  email: string;
  role?: string;
};

export type Course = {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  level?: string | null;
  status: "draft" | "published" | "archived";
  published_at?: string | null;
  thumbnail_path?: string | null;
  instructor?: User | null;
  modules?: Module[];
  lessons?: Lesson[];
  assignments?: Assignment[];
  quizzes?: Quiz[];
};

export type Module = {
  id: number;
  course_id: number;
  title: string;
  description?: string | null;
  takeaways?: string[] | null;
  sort_order: number;
  lessons?: Lesson[];
};

export type Lesson = {
  id: number;
  module_id: number;
  title: string;
  content?: string | null;
  video_url?: string | null;
  duration_seconds?: number | null;
  sort_order: number;
  is_published: boolean;
};

export type Assignment = {
  id: number;
  course_id: number;
  lesson_id?: number | null;
  title: string;
  description?: string | null;
  due_at?: string | null;
  max_points: number;
  is_published: boolean;
};

export type Quiz = {
  id: number;
  course_id: number;
  lesson_id?: number | null;
  title: string;
  description?: string | null;
  time_limit_minutes?: number | null;
  max_attempts?: number | null;
  is_published: boolean;
};

export type QuizQuestion = {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: "multiple_choice" | "single_choice" | "true_false" | "essay";
  options?: string[] | null;
  correct_answer?: string[] | null;
  points: number;
  sort_order: number;
};

export type Enrollment = {
  id: number;
  course_id: number;
  user_id: number;
  status: string;
  enrolled_at: string;
  completed_at?: string | null;
  course?: Course;
};

export type Resource = {
  id: number;
  course_id?: number | null;
  lesson_id?: number | null;
  uploaded_by: number;
  title: string;
  type: string;
  path: string;
  is_private: boolean;
  created_at?: string | null;
  course?: Course | null;
  lesson?: Lesson | null;
};

export type AssignmentSubmission = {
  id: number;
  assignment_id: number;
  user_id: number;
  content?: string | null;
  file_path?: string | null;
  submitted_at: string;
  graded_at?: string | null;
  score?: number | null;
  user?: User | null;
  assignment?: Assignment | null;
};

export type QuizAnswer = {
  id: number;
  quiz_attempt_id: number;
  quiz_question_id: number;
  answer?: string[] | string | null;
  is_correct?: boolean | null;
  points_awarded?: number | null;
  question?: QuizQuestion | null;
};

export type QuizAttempt = {
  id: number;
  quiz_id: number;
  user_id: number;
  started_at?: string | null;
  completed_at?: string | null;
  score?: number | null;
  answers?: QuizAnswer[];
  quiz?: Quiz | null;
  user?: User | null;
};

export type StudentDashboardCourse = {
  id: number;
  title: string;
  status: string;
  instructor?: User | null;
  total_lessons: number;
  completed_lessons: number;
  average_progress: number;
  completion_percent?: number;
  enrolled_at: string;
  completed_at?: string | null;
};

export type StudentDashboardOverview = {
  courses: StudentDashboardCourse[];
  upcoming_assignments: Assignment[];
  available_quizzes: Quiz[];
};

export type NotificationItem = {
  type: string;
  id: number;
  title: string;
  course?: { id: number; title: string } | null;
  lesson?: { id: number; title: string } | null;
  course_id?: number | null;
  due_at?: string | null;
  created_at?: string | null;
};

export type StudentNotifications = {
  upcoming_assignments: NotificationItem[];
  new_lessons: NotificationItem[];
  new_quizzes: NotificationItem[];
};

export type StudentCourseworkAssignment = {
  id: number;
  title: string;
  course?: { id: number; title: string } | null;
  lesson?: { id: number; title: string } | null;
  due_at?: string | null;
  is_published: boolean;
  status: "pending" | "submitted" | "graded" | "overdue";
  submitted_at?: string | null;
  graded_at?: string | null;
  score?: number | null;
};

export type StudentCourseworkQuiz = {
  id: number;
  title: string;
  course?: { id: number; title: string } | null;
  lesson?: { id: number; title: string } | null;
  max_attempts?: number | null;
  attempts_used: number;
  attempts_remaining?: number | null;
  last_score?: number | null;
  last_attempted_at?: string | null;
  status: "attempted" | "not_started";
};

export type StudentCoursework = {
  assignments: StudentCourseworkAssignment[];
  quizzes: StudentCourseworkQuiz[];
};

export type StudentActivityItem = {
  type: string;
  id: number;
  assignment?: { id: number; title: string } | null;
  quiz?: { id: number; title: string } | null;
  course?: { id: number; title: string } | null;
  lesson?: { id: number; title: string } | null;
  submitted_at?: string | null;
  graded_at?: string | null;
  completed_at?: string | null;
  score?: number | null;
  student?: User | null;
};

export type StudentActivity = {
  assignment_submissions: StudentActivityItem[];
  quiz_attempts: StudentActivityItem[];
};

export type CourseProgressSummary = {
  course_id: number;
  total_lessons: number;
  completed_lessons: number;
  average_progress: number;
};

export type ResumeLesson = {
  lesson: { id: number; title: string; module_id: number } | null;
  module: { id: number; title: string; course_id: number } | null;
  course?: { id: number; title: string } | null;
  progress_percent: number;
  updated_at: string;
} | null;

export type CourseModuleProgress = {
  id: number;
  title: string;
  total_lessons: number;
  completed_lessons: number;
  average_progress: number;
};

export type CourseRosterProgressRow = {
  user_id: number;
  total: number;
  completed: number;
  average_progress: number;
  user?: User | null;
};

export type StudentCourseDashboard = {
  course: { id: number; title: string; status: string };
  progress: CourseProgressSummary;
  resume_lesson: ResumeLesson;
  upcoming_assignments: Assignment[];
  recent_quizzes: Quiz[];
  modules: CourseModuleProgress[];
};

export type AnalyticsOverview = {
  courses_total: number;
  courses_published: number;
  enrollments_total: number;
  completion_rate: number;
  students_total?: number;
  instructors_total?: number;
};

export type AnalyticsCourseRow = {
  id: number;
  title: string;
  status: string;
  enrollments: number;
  progress_total: number;
  progress_completed: number;
  average_progress: number;
  instructor?: User | null;
};
