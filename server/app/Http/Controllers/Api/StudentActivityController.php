<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssignmentSubmission;
use App\Models\Enrollment;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;

class StudentActivityController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if (! $user?->isStudent() && ! $user?->isAdmin()) {
            abort(403, 'Students only.');
        }

        $courseId = $request->query('course_id');
        $submissionsPage = (int) $request->query('submissions_page', 1);
        $submissionsPerPage = min((int) $request->query('submissions_per_page', 20), 100);
        $attemptsPage = (int) $request->query('attempts_page', 1);
        $attemptsPerPage = min((int) $request->query('attempts_per_page', 20), 100);

        if ($courseId && ! $user->isAdmin()) {
            $isEnrolled = Enrollment::query()
                ->where('course_id', $courseId)
                ->where('user_id', $user->id)
                ->exists();

            if (! $isEnrolled) {
                abort(403, 'You are not enrolled in this course.');
            }
        }

        $submissionsQuery = AssignmentSubmission::query()
            ->with(['assignment.course', 'assignment.lesson'])
            ->where('user_id', $user->id)
            ->orderByDesc('submitted_at');

        if ($courseId) {
            $submissionsQuery->whereHas('assignment', function ($builder) use ($courseId) {
                $builder->where('course_id', $courseId);
            });
        }

        $submissionsPageData = $submissionsQuery
            ->paginate(
                $submissionsPerPage,
                ['*'],
                'submissions_page',
                $submissionsPage
            );

        $submissions = $submissionsPageData->getCollection()->map(function (AssignmentSubmission $submission) {
                return [
                    'type' => 'assignment_submission',
                    'id' => $submission->id,
                    'assignment' => $submission->assignment?->only(['id', 'title']),
                    'course' => $submission->assignment?->course?->only(['id', 'title']),
                    'lesson' => $submission->assignment?->lesson?->only(['id', 'title']),
                    'submitted_at' => $submission->submitted_at,
                    'graded_at' => $submission->graded_at,
                    'score' => $submission->score,
                ];
            });

        $attemptsQuery = QuizAttempt::query()
            ->with(['quiz.course', 'quiz.lesson'])
            ->where('user_id', $user->id)
            ->orderByDesc('completed_at');

        if ($courseId) {
            $attemptsQuery->whereHas('quiz', function ($builder) use ($courseId) {
                $builder->where('course_id', $courseId);
            });
        }

        $attemptsPageData = $attemptsQuery
            ->paginate(
                $attemptsPerPage,
                ['*'],
                'attempts_page',
                $attemptsPage
            );

        $attempts = $attemptsPageData->getCollection()->map(function (QuizAttempt $attempt) {
                return [
                    'type' => 'quiz_attempt',
                    'id' => $attempt->id,
                    'quiz' => $attempt->quiz?->only(['id', 'title']),
                    'course' => $attempt->quiz?->course?->only(['id', 'title']),
                    'lesson' => $attempt->quiz?->lesson?->only(['id', 'title']),
                    'completed_at' => $attempt->completed_at,
                    'score' => $attempt->score,
                ];
            });

        return response()->json([
            'data' => [
                'assignment_submissions' => $submissions,
                'quiz_attempts' => $attempts,
            ],
            'meta' => [
                'assignment_submissions' => [
                    'current_page' => $submissionsPageData->currentPage(),
                    'per_page' => $submissionsPageData->perPage(),
                    'total' => $submissionsPageData->total(),
                    'last_page' => $submissionsPageData->lastPage(),
                ],
                'quiz_attempts' => [
                    'current_page' => $attemptsPageData->currentPage(),
                    'per_page' => $attemptsPageData->perPage(),
                    'total' => $attemptsPageData->total(),
                    'last_page' => $attemptsPageData->lastPage(),
                ],
            ],
        ]);
    }
}
