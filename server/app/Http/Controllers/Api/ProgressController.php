<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreLessonProgressRequest;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\LessonProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProgressController extends Controller
{
    public function upsert(StoreLessonProgressRequest $request)
    {
        $user = $request->user();

        if (! $user?->isStudent()) {
            abort(403, 'Only students can update progress.');
        }

        $data = $request->validated();

        $progress = LessonProgress::updateOrCreate(
            ['lesson_id' => $data['lesson_id'], 'user_id' => $user->id],
            [
                'status' => $data['status'],
                'progress_percent' => $data['progress_percent'],
                'completed_at' => $data['status'] === 'completed' ? now() : null,
            ]
        );

        return response()->json(['data' => $progress]);
    }

    public function courseSummary(Request $request, Course $course)
    {
        $user = $request->user();

        if (! $user?->isStudent() && ! $user?->isAdmin()) {
            abort(403, 'Only students can view progress summary.');
        }

        $lessonIds = $course->lessons()->pluck('lessons.id');

        $summary = LessonProgress::query()
            ->where('user_id', $user->id)
            ->whereIn('lesson_id', $lessonIds)
            ->selectRaw('count(*) as total')
            ->selectRaw("sum(case when status = 'completed' then 1 else 0 end) as completed")
            ->selectRaw('avg(progress_percent) as average_progress')
            ->first();

        return response()->json([
            'data' => [
                'course_id' => $course->id,
                'total_lessons' => (int) ($summary?->total ?? 0),
                'completed_lessons' => (int) ($summary?->completed ?? 0),
                'average_progress' => (float) ($summary?->average_progress ?? 0),
            ],
        ]);
    }

    public function courseRosterSummary(Request $request, Course $course)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && $course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to view course progress.');
        }

        $lessonIds = $course->lessons()->pluck('lessons.id');

        $summary = LessonProgress::query()
            ->whereIn('lesson_id', $lessonIds)
            ->select('user_id')
            ->selectRaw('count(*) as total')
            ->selectRaw("sum(case when status = 'completed' then 1 else 0 end) as completed")
            ->selectRaw('avg(progress_percent) as average_progress')
            ->groupBy('user_id')
            ->with('user')
            ->get();

        return response()->json(['data' => $summary]);
    }

    public function resumeLesson(Request $request)
    {
        $user = $request->user();

        if (! $user?->isStudent() && ! $user?->isAdmin()) {
            abort(403, 'Students only.');
        }

        $courseId = $request->query('course_id');

        $progressQuery = LessonProgress::query()
            ->with(['lesson.module.course'])
            ->where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->orderByDesc('updated_at');

        if ($courseId) {
            $progressQuery->whereHas('lesson.module.course', function ($builder) use ($courseId) {
                $builder->where('courses.id', $courseId);
            });
        }

        $progress = $progressQuery->first();

        if (! $progress) {
            return response()->json(['data' => null]);
        }

        $course = $progress->lesson?->module?->course;

        if (! $user->isAdmin()) {
            $isEnrolled = $course
                ? Enrollment::query()
                    ->where('course_id', $course->id)
                    ->where('user_id', $user->id)
                    ->exists()
                : false;

            if (! $isEnrolled) {
                abort(403, 'You are not enrolled in this course.');
            }
        }

        return response()->json([
            'data' => [
                'lesson' => $progress->lesson?->only(['id', 'title', 'module_id']),
                'module' => $progress->lesson?->module?->only(['id', 'title', 'course_id']),
                'course' => $course?->only(['id', 'title']),
                'progress_percent' => $progress->progress_percent,
                'updated_at' => $progress->updated_at,
            ],
        ]);
    }
}
