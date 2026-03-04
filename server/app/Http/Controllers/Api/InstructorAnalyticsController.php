<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InstructorAnalyticsController extends Controller
{
    public function overview(Request $request)
    {
        $user = $request->user();

        if (! $user?->isInstructor() && ! $user?->isAdmin()) {
            abort(403, 'Instructors only.');
        }

        $coursesTotal = Course::query()
            ->where('instructor_id', $user->id)
            ->count();

        $coursesPublished = Course::query()
            ->where('instructor_id', $user->id)
            ->where('status', 'published')
            ->count();

        $enrollmentsTotal = Enrollment::query()
            ->whereHas('course', function ($builder) use ($user) {
                $builder->where('instructor_id', $user->id);
            })
            ->count();

        $progressTotals = DB::table('lesson_progress')
            ->join('lessons', 'lesson_progress.lesson_id', '=', 'lessons.id')
            ->join('modules', 'lessons.module_id', '=', 'modules.id')
            ->join('courses', 'modules.course_id', '=', 'courses.id')
            ->where('courses.instructor_id', $user->id)
            ->selectRaw('count(*) as total')
            ->selectRaw("sum(case when lesson_progress.status = 'completed' then 1 else 0 end) as completed")
            ->first();

        $completionRate = 0.0;
        if ($progressTotals && $progressTotals->total > 0) {
            $completionRate = ($progressTotals->completed / $progressTotals->total) * 100;
        }

        return response()->json([
            'data' => [
                'courses_total' => $coursesTotal,
                'courses_published' => $coursesPublished,
                'enrollments_total' => $enrollmentsTotal,
                'completion_rate' => round($completionRate, 2),
            ],
        ]);
    }

    public function courses(Request $request)
    {
        $user = $request->user();

        if (! $user?->isInstructor() && ! $user?->isAdmin()) {
            abort(403, 'Instructors only.');
        }

        $enrollmentsByCourse = Enrollment::query()
            ->whereHas('course', function ($builder) use ($user) {
                $builder->where('instructor_id', $user->id);
            })
            ->select('course_id', DB::raw('count(*) as enrollments'))
            ->groupBy('course_id')
            ->pluck('enrollments', 'course_id');

        $progressByCourse = DB::table('lesson_progress')
            ->join('lessons', 'lesson_progress.lesson_id', '=', 'lessons.id')
            ->join('modules', 'lessons.module_id', '=', 'modules.id')
            ->join('courses', 'modules.course_id', '=', 'courses.id')
            ->where('courses.instructor_id', $user->id)
            ->select('courses.id')
            ->selectRaw('count(*) as total_progress')
            ->selectRaw("sum(case when lesson_progress.status = 'completed' then 1 else 0 end) as completed")
            ->selectRaw('avg(lesson_progress.progress_percent) as average_progress')
            ->groupBy('courses.id')
            ->get()
            ->keyBy('id');

        $courses = Course::query()
            ->where('instructor_id', $user->id)
            ->latest()
            ->get()
            ->map(function (Course $course) use ($enrollmentsByCourse, $progressByCourse) {
                $progress = $progressByCourse->get($course->id);

                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'status' => $course->status,
                    'enrollments' => (int) ($enrollmentsByCourse[$course->id] ?? 0),
                    'progress_total' => (int) ($progress->total_progress ?? 0),
                    'progress_completed' => (int) ($progress->completed ?? 0),
                    'average_progress' => round((float) ($progress->average_progress ?? 0), 2),
                ];
            });

        return response()->json(['data' => $courses]);
    }
}
