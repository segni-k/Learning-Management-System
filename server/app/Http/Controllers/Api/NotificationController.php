<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Quiz;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if (! $user?->isStudent() && ! $user?->isAdmin()) {
            abort(403, 'Students only.');
        }

        $courseIds = Enrollment::query()
            ->where('user_id', $user->id)
            ->pluck('course_id');

        $upcomingAssignments = $this->upcomingAssignments($courseIds);
        $newLessons = $this->newLessons($courseIds);
        $availableQuizzes = $this->newQuizzes($courseIds);

        return response()->json([
            'data' => [
                'upcoming_assignments' => $upcomingAssignments,
                'new_lessons' => $newLessons,
                'new_quizzes' => $availableQuizzes,
            ],
        ]);
    }

    private function upcomingAssignments($courseIds)
    {
        return Assignment::query()
            ->with(['course', 'lesson'])
            ->whereIn('course_id', $courseIds)
            ->where('is_published', true)
            ->whereNotNull('due_at')
            ->whereBetween('due_at', [now(), now()->addDays(14)])
            ->orderBy('due_at')
            ->limit(10)
            ->get()
            ->map(function (Assignment $assignment) {
                return [
                    'type' => 'assignment_due',
                    'id' => $assignment->id,
                    'title' => $assignment->title,
                    'course' => $assignment->course?->only(['id', 'title']),
                    'lesson' => $assignment->lesson?->only(['id', 'title']),
                    'due_at' => $assignment->due_at,
                ];
            });
    }

    private function newLessons($courseIds)
    {
        return DB::table('lessons')
            ->join('modules', 'lessons.module_id', '=', 'modules.id')
            ->whereIn('modules.course_id', $courseIds)
            ->where('lessons.is_published', true)
            ->where('lessons.created_at', '>=', now()->subDays(7))
            ->select('lessons.id', 'lessons.title', 'lessons.created_at', 'modules.course_id')
            ->orderBy('lessons.created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($lesson) {
                return [
                    'type' => 'new_lesson',
                    'id' => $lesson->id,
                    'title' => $lesson->title,
                    'course_id' => $lesson->course_id,
                    'created_at' => $lesson->created_at,
                ];
            });
    }

    private function newQuizzes($courseIds)
    {
        return Quiz::query()
            ->with(['course', 'lesson'])
            ->whereIn('course_id', $courseIds)
            ->where('is_published', true)
            ->where('created_at', '>=', now()->subDays(7))
            ->latest()
            ->limit(10)
            ->get()
            ->map(function (Quiz $quiz) {
                return [
                    'type' => 'new_quiz',
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'course' => $quiz->course?->only(['id', 'title']),
                    'lesson' => $quiz->lesson?->only(['id', 'title']),
                    'created_at' => $quiz->created_at,
                ];
            });
    }
}
