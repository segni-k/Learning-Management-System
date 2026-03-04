<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\LessonProgress;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminAnalyticsController extends Controller
{
    public function overview(Request $request)
    {
        $user = $request->user();

        if (! $user?->isAdmin()) {
            abort(403, 'Admins only.');
        }

        $coursesTotal = Course::query()->count();
        $coursesPublished = Course::query()->where('status', 'published')->count();
        $studentsTotal = User::query()->where('role', User::ROLE_STUDENT)->count();
        $instructorsTotal = User::query()->where('role', User::ROLE_INSTRUCTOR)->count();
        $enrollmentsTotal = Enrollment::query()->count();

        $progressTotals = LessonProgress::query()
            ->selectRaw('count(*) as total')
            ->selectRaw("sum(case when status = 'completed' then 1 else 0 end) as completed")
            ->first();

        $completionRate = 0.0;
        if ($progressTotals && $progressTotals->total > 0) {
            $completionRate = ($progressTotals->completed / $progressTotals->total) * 100;
        }

        return response()->json([
            'data' => [
                'courses_total' => $coursesTotal,
                'courses_published' => $coursesPublished,
                'students_total' => $studentsTotal,
                'instructors_total' => $instructorsTotal,
                'enrollments_total' => $enrollmentsTotal,
                'completion_rate' => round($completionRate, 2),
            ],
        ]);
    }

    public function courses(Request $request)
    {
        $user = $request->user();

        if (! $user?->isAdmin()) {
            abort(403, 'Admins only.');
        }

        $enrollmentsByCourse = Enrollment::query()
            ->select('course_id', DB::raw('count(*) as enrollments'))
            ->groupBy('course_id')
            ->pluck('enrollments', 'course_id');

        $progressByCourse = DB::table('lesson_progress')
            ->join('lessons', 'lesson_progress.lesson_id', '=', 'lessons.id')
            ->join('modules', 'lessons.module_id', '=', 'modules.id')
            ->join('courses', 'modules.course_id', '=', 'courses.id')
            ->select('courses.id')
            ->selectRaw('count(*) as total_progress')
            ->selectRaw("sum(case when lesson_progress.status = 'completed' then 1 else 0 end) as completed")
            ->selectRaw('avg(lesson_progress.progress_percent) as average_progress')
            ->groupBy('courses.id')
            ->get()
            ->keyBy('id');

        $courses = Course::query()
            ->with('instructor')
            ->latest()
            ->get()
            ->map(function (Course $course) use ($enrollmentsByCourse, $progressByCourse) {
                $progress = $progressByCourse->get($course->id);

                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'status' => $course->status,
                    'instructor' => $course->instructor?->only(['id', 'name', 'email']),
                    'enrollments' => (int) ($enrollmentsByCourse[$course->id] ?? 0),
                    'progress_total' => (int) ($progress->total_progress ?? 0),
                    'progress_completed' => (int) ($progress->completed ?? 0),
                    'average_progress' => round((float) ($progress->average_progress ?? 0), 2),
                ];
            });

        return response()->json(['data' => $courses]);
    }
}
