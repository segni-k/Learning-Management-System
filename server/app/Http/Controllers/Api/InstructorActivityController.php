<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;

class InstructorActivityController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if (! $user?->isInstructor() && ! $user?->isAdmin()) {
            abort(403, 'Instructors only.');
        }

        $courseId = $request->query('course_id');
        $submissionsPage = (int) $request->query('submissions_page', 1);
        $submissionsPerPage = min((int) $request->query('submissions_per_page', 20), 100);
        $attemptsPage = (int) $request->query('attempts_page', 1);
        $attemptsPerPage = min((int) $request->query('attempts_per_page', 20), 100);

        if ($courseId && ! $user->isAdmin()) {
            $isOwner = Course::query()
                ->where('id', $courseId)
                ->where('instructor_id', $user->id)
                ->exists();

            if (! $isOwner) {
                abort(403, 'You do not have access to this course.');
            }
        }

        $submissionsQuery = AssignmentSubmission::query()
            ->with(['assignment.course', 'assignment.lesson', 'user'])
            ->whereHas('assignment.course', function ($builder) use ($user) {
                if (! $user->isAdmin()) {
                    $builder->where('instructor_id', $user->id);
                }
            })
            ->orderByDesc('submitted_at');

        if ($courseId) {
            $submissionsQuery->whereHas('assignment', function ($builder) use ($courseId) {
                $builder->where('course_id', $courseId);
            });
        }

        $submissionsPageData = $submissionsQuery->paginate(
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
                'student' => $submission->user?->only(['id', 'name', 'email']),
                'submitted_at' => $submission->submitted_at,
                'graded_at' => $submission->graded_at,
                'score' => $submission->score,
            ];
        });

        $attemptsQuery = QuizAttempt::query()
            ->with(['quiz.course', 'quiz.lesson', 'user'])
            ->whereHas('quiz.course', function ($builder) use ($user) {
                if (! $user->isAdmin()) {
                    $builder->where('instructor_id', $user->id);
                }
            })
            ->orderByDesc('completed_at');

        if ($courseId) {
            $attemptsQuery->whereHas('quiz', function ($builder) use ($courseId) {
                $builder->where('course_id', $courseId);
            });
        }

        $attemptsPageData = $attemptsQuery->paginate(
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
                'student' => $attempt->user?->only(['id', 'name', 'email']),
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
