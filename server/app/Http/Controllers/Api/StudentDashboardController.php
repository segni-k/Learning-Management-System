<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Enrollment;
use App\Models\Quiz;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentDashboardController extends Controller
{
    public function overview(Request $request)
    {
        $user = $request->user();

        if (! $user?->isStudent() && ! $user?->isAdmin()) {
            abort(403, 'Students only.');
        }

        $enrollments = Enrollment::query()
            ->with('course.instructor')
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        $courseIds = $enrollments->pluck('course_id');

        $totalLessonsByCourse = DB::table('lessons')
            ->join('modules', 'lessons.module_id', '=', 'modules.id')
            ->whereIn('modules.course_id', $courseIds)
            ->select('modules.course_id')
            ->selectRaw('count(*) as total')
            ->groupBy('modules.course_id')
            ->pluck('total', 'course_id');

        $progressByCourse = DB::table('lesson_progress')
            ->join('lessons', 'lesson_progress.lesson_id', '=', 'lessons.id')
            ->join('modules', 'lessons.module_id', '=', 'modules.id')
            ->where('lesson_progress.user_id', $user->id)
            ->whereIn('modules.course_id', $courseIds)
            ->select('modules.course_id')
            ->selectRaw("sum(case when lesson_progress.status = 'completed' then 1 else 0 end) as completed")
            ->selectRaw('avg(lesson_progress.progress_percent) as average_progress')
            ->groupBy('modules.course_id')
            ->get()
            ->keyBy('course_id');

        $courses = $enrollments->map(function ($enrollment) use ($totalLessonsByCourse, $progressByCourse) {
            $course = $enrollment->course;
            $courseId = $course->id;
            $progress = $progressByCourse->get($courseId);

            return [
                'id' => $courseId,
                'title' => $course->title,
                'status' => $course->status,
                'instructor' => $course->instructor?->only(['id', 'name', 'email']),
                'total_lessons' => (int) ($totalLessonsByCourse[$courseId] ?? 0),
                'completed_lessons' => (int) ($progress->completed ?? 0),
                'average_progress' => round((float) ($progress->average_progress ?? 0), 2),
                'enrolled_at' => $enrollment->enrolled_at,
            ];
        });

        $upcomingAssignments = Assignment::query()
            ->with(['course', 'lesson'])
            ->whereIn('course_id', $courseIds)
            ->where('is_published', '=', DB::raw('true'))
            ->whereNotNull('due_at')
            ->where('due_at', '>=', now())
            ->orderBy('due_at')
            ->limit(10)
            ->get();

        $availableQuizzes = Quiz::query()
            ->with(['course', 'lesson'])
            ->whereIn('course_id', $courseIds)
            ->where('is_published', '=', DB::raw('true'))
            ->latest()
            ->limit(10)
            ->get();

        return response()->json([
            'data' => [
                'courses' => $courses,
                'upcoming_assignments' => $upcomingAssignments,
                'available_quizzes' => $availableQuizzes,
            ],
        ]);
    }
}
