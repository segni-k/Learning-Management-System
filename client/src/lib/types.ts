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

export type Enrollment = {
  id: number;
  course_id: number;
  user_id: number;
  status: string;
  enrolled_at: string;
  completed_at?: string | null;
  course?: Course;
};
