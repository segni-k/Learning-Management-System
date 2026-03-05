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
