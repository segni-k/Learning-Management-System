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
            ->select(['id', 'course_id', 'user_id', 'enrolled_at', 'completed_at'])
            ->with([
                'course:id,title,status,instructor_id',
                'course.instructor:id,name,email',
            ])
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

        $progressByCourse = DB::table('lessons')
            ->join('modules', 'lessons.module_id', '=', 'modules.id')
            ->leftJoin('lesson_progress', function ($join) use ($user) {
                $join->on('lessons.id', '=', 'lesson_progress.lesson_id')
                    ->where('lesson_progress.user_id', $user->id);
            })
            ->whereIn('modules.course_id', $courseIds)
            ->select('modules.course_id')
            ->selectRaw("sum(case when lesson_progress.status = 'completed' then 1 else 0 end) as completed")
            ->selectRaw('avg(coalesce(lesson_progress.progress_percent, 0)) as average_progress')
            ->groupBy('modules.course_id')
            ->get()
            ->keyBy('course_id');

        $courses = $enrollments->map(function ($enrollment) use ($totalLessonsByCourse, $progressByCourse) {
            $course = $enrollment->course;
            $courseId = $course->id;
            $progress = $progressByCourse->get($courseId);
            $totalLessons = (int) ($totalLessonsByCourse[$courseId] ?? 0);
            $completedLessons = (int) ($progress->completed ?? 0);
            $completionPercent = $totalLessons > 0
                ? round(($completedLessons / $totalLessons) * 100, 2)
                : 0;

            return [
                'id' => $courseId,
                'title' => $course->title,
                'status' => $course->status,
                'instructor' => $course->instructor?->only(['id', 'name', 'email']),
                'total_lessons' => $totalLessons,
                'completed_lessons' => $completedLessons,
                'average_progress' => round((float) ($progress->average_progress ?? 0), 2),
                'completion_percent' => $completionPercent,
                'enrolled_at' => $enrollment->enrolled_at,
                'completed_at' => $enrollment->completed_at,
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
