<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\LessonProgress;
use App\Models\Quiz;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentCourseDashboardController extends Controller
{
    public function show(Request $request, Course $course)
    {
        $user = $request->user();

        if (! $user?->isStudent() && ! $user?->isAdmin()) {
            abort(403, 'Students only.');
        }

        if (! $user->isAdmin()) {
            $isEnrolled = Enrollment::query()
                ->where('course_id', $course->id)
                ->where('user_id', $user->id)
                ->exists();

            if (! $isEnrolled) {
                abort(403, 'You are not enrolled in this course.');
            }
        }

        $lessonIds = $course->lessons()->pluck('lessons.id');

        $summary = LessonProgress::query()
            ->where('user_id', $user->id)
            ->whereIn('lesson_id', $lessonIds)
            ->selectRaw('count(*) as total')
            ->selectRaw("sum(case when status = 'completed' then 1 else 0 end) as completed")
            ->selectRaw('avg(progress_percent) as average_progress')
            ->first();

        $resume = LessonProgress::query()
            ->with(['lesson.module'])
            ->where('user_id', $user->id)
            ->whereIn('lesson_id', $lessonIds)
            ->where('status', 'in_progress')
            ->orderByDesc('updated_at')
            ->first();

        $assignmentsLimit = min((int) $request->query('assignments_limit', 5), 20);
        $quizzesLimit = min((int) $request->query('quizzes_limit', 5), 20);
        $modulesPage = (int) $request->query('modules_page', 1);
        $modulesPerPage = min((int) $request->query('modules_per_page', 10), 100);

        $upcomingAssignments = Assignment::query()
            ->with(['lesson'])
            ->where('course_id', $course->id)
            ->where('is_published', '=', DB::raw('true'))
            ->whereNotNull('due_at')
            ->where('due_at', '>=', now())
            ->orderBy('due_at')
            ->limit($assignmentsLimit)
            ->get();

        $recentQuizzes = Quiz::query()
            ->with(['lesson'])
            ->where('course_id', $course->id)
            ->where('is_published', '=', DB::raw('true'))
            ->latest()
            ->limit($quizzesLimit)
            ->get();

        $moduleProgress = DB::table('lessons')
            ->join('modules', 'lessons.module_id', '=', 'modules.id')
            ->leftJoin('lesson_progress', function ($join) use ($user) {
                $join->on('lessons.id', '=', 'lesson_progress.lesson_id')
                    ->where('lesson_progress.user_id', $user->id);
            })
            ->where('modules.course_id', $course->id)
            ->select('modules.id', 'modules.title')
            ->selectRaw('count(lessons.id) as total_lessons')
            ->selectRaw("sum(case when lesson_progress.status = 'completed' then 1 else 0 end) as completed_lessons")
            ->selectRaw('avg(lesson_progress.progress_percent) as average_progress')
            ->groupBy('modules.id', 'modules.title')
            ->orderBy('modules.sort_order')
            ->get()
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'title' => $row->title,
                    'total_lessons' => (int) $row->total_lessons,
                    'completed_lessons' => (int) ($row->completed_lessons ?? 0),
                    'average_progress' => round((float) ($row->average_progress ?? 0), 2),
                ];
            });

        $modulesTotal = $moduleProgress->count();
        $modulesLastPage = (int) ceil($modulesTotal / max($modulesPerPage, 1));
        $modulesPageData = $moduleProgress->forPage($modulesPage, $modulesPerPage)->values();

        return response()->json([
            'data' => [
                'course' => $course->only(['id', 'title', 'status']),
                'progress' => [
                    'total_lessons' => (int) ($summary?->total ?? 0),
                    'completed_lessons' => (int) ($summary?->completed ?? 0),
                    'average_progress' => (float) ($summary?->average_progress ?? 0),
                ],
                'resume_lesson' => $resume
                    ? [
                        'lesson' => $resume->lesson?->only(['id', 'title', 'module_id']),
                        'module' => $resume->lesson?->module?->only(['id', 'title', 'course_id']),
                        'progress_percent' => $resume->progress_percent,
                        'updated_at' => $resume->updated_at,
                    ]
                    : null,
                'upcoming_assignments' => $upcomingAssignments,
                'recent_quizzes' => $recentQuizzes,
                'modules' => $modulesPageData,
            ],
            'meta' => [
                'modules' => [
                    'current_page' => $modulesPage,
                    'per_page' => $modulesPerPage,
                    'total' => $modulesTotal,
                    'last_page' => $modulesLastPage,
                ],
            ],
        ]);
    }
}
