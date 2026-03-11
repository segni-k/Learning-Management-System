<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\NotificationRead;
use App\Models\Quiz;
use Illuminate\Support\Collection;
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
            ->pluck('course_id')
            ->all();

        $payload = $this->buildNotificationPayload($user->id, $courseIds);

        return response()->json([
            'data' => $payload,
        ]);
    }

    public function summary(Request $request)
    {
        $user = $request->user();

        if (! $user?->isStudent() && ! $user?->isAdmin()) {
            abort(403, 'Students only.');
        }

        $courseIds = Enrollment::query()
            ->where('user_id', $user->id)
            ->pluck('course_id')
            ->all();

        $payload = $this->buildNotificationPayload($user->id, $courseIds);

        return response()->json([
            'data' => [
                'unread_count' => $payload['summary']['unread_count'],
                'total_count' => $payload['summary']['total_count'],
            ],
        ]);
    }

    public function markRead(Request $request)
    {
        $user = $request->user();

        if (! $user?->isStudent() && ! $user?->isAdmin()) {
            abort(403, 'Students only.');
        }

        $data = $request->validate([
            'notifications' => ['required', 'array', 'min:1'],
            'notifications.*.type' => ['required', 'string', 'max:50'],
            'notifications.*.id' => ['required', 'integer', 'min:1'],
        ]);

        $now = now();

        foreach ($data['notifications'] as $notification) {
            NotificationRead::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'notification_type' => $notification['type'],
                    'notification_id' => $notification['id'],
                ],
                ['read_at' => $now]
            );
        }

        return response()->json(['message' => 'Notifications marked as read.']);
    }

    private function buildNotificationPayload(int $userId, array $courseIds): array
    {
        if (empty($courseIds)) {
            return [
                'upcoming_assignments' => [],
                'new_lessons' => [],
                'new_quizzes' => [],
                'summary' => [
                    'unread_count' => 0,
                    'total_count' => 0,
                ],
            ];
        }

        $upcomingAssignments = $this->upcomingAssignments($courseIds);
        $newLessons = $this->newLessons($courseIds);
        $availableQuizzes = $this->newQuizzes($courseIds);

        $allNotifications = collect()
            ->concat($upcomingAssignments)
            ->concat($newLessons)
            ->concat($availableQuizzes)
            ->values();

        $readKeys = $this->readNotificationKeys($userId, $allNotifications);

        $withReadState = fn (Collection $items) => $items->map(function (array $item) use ($readKeys) {
            $item['is_read'] = $readKeys->contains($item['type'].':'.$item['id']);

            return $item;
        })->values()->all();

        $unreadCount = $allNotifications->filter(function (array $item) use ($readKeys) {
            return ! $readKeys->contains($item['type'].':'.$item['id']);
        })->count();

        return [
            'upcoming_assignments' => $withReadState($upcomingAssignments),
            'new_lessons' => $withReadState($newLessons),
            'new_quizzes' => $withReadState($availableQuizzes),
            'summary' => [
                'unread_count' => $unreadCount,
                'total_count' => $allNotifications->count(),
            ],
        ];
    }

    private function readNotificationKeys(int $userId, Collection $notifications): Collection
    {
        if ($notifications->isEmpty()) {
            return collect();
        }

        $pairs = $notifications
            ->map(fn (array $item) => ['type' => $item['type'], 'id' => $item['id']])
            ->unique(fn (array $item) => $item['type'].':'.$item['id'])
            ->values();

        $reads = NotificationRead::query()
            ->where('user_id', $userId)
            ->where(function ($query) use ($pairs) {
                foreach ($pairs as $pair) {
                    $query->orWhere(function ($nested) use ($pair) {
                        $nested->where('notification_type', $pair['type'])
                            ->where('notification_id', $pair['id']);
                    });
                }
            })
            ->get(['notification_type', 'notification_id']);

        return $reads->map(fn (NotificationRead $read) => $read->notification_type.':'.$read->notification_id);
    }

    private function upcomingAssignments(array $courseIds): Collection
    {
        return Assignment::query()
            ->select(['id', 'course_id', 'lesson_id', 'title', 'due_at'])
            ->with(['course:id,title', 'lesson:id,title'])
            ->whereIn('course_id', $courseIds)
            ->whereRaw('is_published is true')
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
                    'course_id' => $assignment->course_id,
                    'due_at' => $assignment->due_at,
                ];
            });
    }

    private function newLessons(array $courseIds): Collection
    {
        return DB::table('lessons')
            ->join('modules', 'lessons.module_id', '=', 'modules.id')
            ->join('courses', 'modules.course_id', '=', 'courses.id')
            ->whereIn('modules.course_id', $courseIds)
            ->whereRaw('lessons.is_published is true')
            ->where('lessons.created_at', '>=', now()->subDays(7))
            ->select('lessons.id', 'lessons.title', 'lessons.created_at', 'modules.course_id', 'courses.title as course_title')
            ->orderBy('lessons.created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($lesson) {
                return [
                    'type' => 'new_lesson',
                    'id' => $lesson->id,
                    'title' => $lesson->title,
                    'course' => [
                        'id' => $lesson->course_id,
                        'title' => $lesson->course_title,
                    ],
                    'course_id' => $lesson->course_id,
                    'created_at' => $lesson->created_at,
                ];
            });
    }

    private function newQuizzes(array $courseIds): Collection
    {
        return Quiz::query()
            ->select(['id', 'course_id', 'lesson_id', 'title', 'created_at'])
            ->with(['course:id,title', 'lesson:id,title'])
            ->whereIn('course_id', $courseIds)
            ->whereRaw('is_published is true')
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
                    'course_id' => $quiz->course_id,
                    'created_at' => $quiz->created_at,
                ];
            });
    }
}
