<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Enrollment;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;

class StudentCourseworkController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if (! $user || (! $user->isStudent() && ! $user->isAdmin())) {
            abort(403, 'Students only.');
        }

        $courseIds = Enrollment::query()
            ->where('user_id', $user->id)
            ->pluck('course_id')
            ->all();

        $courseId = $request->query('course_id');
        if ($courseId && ! in_array((int) $courseId, array_map('intval', $courseIds), true)) {
            return response()->json([
                'data' => [
                    'assignments' => [],
                    'quizzes' => [],
                ],
                'meta' => [
                    'assignments' => [
                        'current_page' => 1,
                        'per_page' => 0,
                        'total' => 0,
                        'last_page' => 1,
                    ],
                    'quizzes' => [
                        'current_page' => 1,
                        'per_page' => 0,
                        'total' => 0,
                        'last_page' => 1,
                    ],
                ],
            ]);
        }

        if (empty($courseIds)) {
            return response()->json([
                'data' => [
                    'assignments' => [],
                    'quizzes' => [],
                ],
                'meta' => [
                    'assignments' => [
                        'current_page' => 1,
                        'per_page' => 0,
                        'total' => 0,
                        'last_page' => 1,
                    ],
                    'quizzes' => [
                        'current_page' => 1,
                        'per_page' => 0,
                        'total' => 0,
                        'last_page' => 1,
                    ],
                ],
            ]);
        }

        $assignmentsPage = (int) $request->query('assignments_page', 1);
        $assignmentsPerPage = min((int) $request->query('assignments_per_page', 20), 100);
        $assignmentsStatus = $request->query('assignments_status');
        $dueFrom = $request->query('due_from');
        $dueTo = $request->query('due_to');

        $assignmentsQuery = Assignment::query()
            ->with(['course:id,title', 'lesson:id,title'])
            ->whereIn('course_id', $courseIds)
            ->whereRaw('assignments.is_published is true')
            ->leftJoin('assignment_submissions as submissions', function ($join) use ($user) {
                $join->on('assignments.id', '=', 'submissions.assignment_id')
                    ->where('submissions.user_id', $user->id);
            })
            ->select([
                'assignments.id',
                'assignments.course_id',
                'assignments.lesson_id',
                'assignments.title',
                'assignments.due_at',
                'assignments.is_published',
                'submissions.id as submission_id',
                'submissions.submitted_at as submission_submitted_at',
                'submissions.graded_at as submission_graded_at',
                'submissions.score as submission_score',
            ]);

        if ($courseId) {
            $assignmentsQuery->where('assignments.course_id', $courseId);
        }

        if ($dueFrom) {
            $assignmentsQuery->where('assignments.due_at', '>=', $dueFrom);
        }

        if ($dueTo) {
            $assignmentsQuery->where('assignments.due_at', '<=', $dueTo);
        }

        if ($assignmentsStatus === 'graded') {
            $assignmentsQuery->whereNotNull('submissions.graded_at');
        } elseif ($assignmentsStatus === 'submitted') {
            $assignmentsQuery->whereNotNull('submissions.id')
                ->whereNull('submissions.graded_at');
        } elseif ($assignmentsStatus === 'pending') {
            $assignmentsQuery->whereNull('submissions.id');
        } elseif ($assignmentsStatus === 'overdue') {
            $assignmentsQuery->whereNull('submissions.id')
                ->whereNotNull('assignments.due_at')
                ->where('assignments.due_at', '<', now());
        }

        $assignmentsPageData = $assignmentsQuery
            ->orderBy('assignments.due_at')
            ->paginate(
                $assignmentsPerPage,
                ['*'],
                'assignments_page',
                $assignmentsPage
            );

        $assignmentsData = $assignmentsPageData->getCollection()->map(function (Assignment $assignment) {
            $submittedAt = $assignment->getAttribute('submission_submitted_at');
            $gradedAt = $assignment->getAttribute('submission_graded_at');
            $hasSubmission = ! is_null($assignment->getAttribute('submission_id'));

            return [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'course' => $assignment->course ? $assignment->course->only(['id', 'title']) : null,
                'lesson' => $assignment->lesson ? $assignment->lesson->only(['id', 'title']) : null,
                'due_at' => $assignment->due_at,
                'is_published' => $assignment->is_published,
                'status' => $hasSubmission ? ($gradedAt ? 'graded' : 'submitted') : 'pending',
                'submitted_at' => $submittedAt,
                'graded_at' => $gradedAt,
                'score' => $assignment->getAttribute('submission_score'),
            ];
        });

        $quizzesPage = (int) $request->query('quizzes_page', 1);
        $quizzesPerPage = min((int) $request->query('quizzes_per_page', 20), 100);
        $quizStatus = $request->query('quiz_status');

        $attemptsUsedSub = QuizAttempt::query()
            ->selectRaw('count(*)')
            ->whereColumn('quiz_attempts.quiz_id', 'quizzes.id')
            ->where('quiz_attempts.user_id', $user->id);

        $lastScoreSub = QuizAttempt::query()
            ->select('score')
            ->whereColumn('quiz_attempts.quiz_id', 'quizzes.id')
            ->where('quiz_attempts.user_id', $user->id)
            ->orderByDesc('completed_at')
            ->limit(1);

        $lastAttemptedSub = QuizAttempt::query()
            ->select('completed_at')
            ->whereColumn('quiz_attempts.quiz_id', 'quizzes.id')
            ->where('quiz_attempts.user_id', $user->id)
            ->orderByDesc('completed_at')
            ->limit(1);

        $quizzesQuery = Quiz::query()
            ->with(['course:id,title', 'lesson:id,title'])
            ->whereIn('course_id', $courseIds)
            ->whereRaw('quizzes.is_published is true')
            ->select(['quizzes.id', 'quizzes.course_id', 'quizzes.lesson_id', 'quizzes.title', 'quizzes.max_attempts', 'quizzes.created_at'])
            ->selectSub($attemptsUsedSub, 'attempts_used')
            ->selectSub($lastScoreSub, 'last_score')
            ->selectSub($lastAttemptedSub, 'last_attempted_at');

        if ($courseId) {
            $quizzesQuery->where('quizzes.course_id', $courseId);
        }

        if ($quizStatus === 'attempted') {
            $quizzesQuery->whereHas('attempts', function ($builder) use ($user) {
                $builder->where('user_id', $user->id);
            });
        } elseif ($quizStatus === 'not_started') {
            $quizzesQuery->whereDoesntHave('attempts', function ($builder) use ($user) {
                $builder->where('user_id', $user->id);
            });
        }

        $quizzesPageData = $quizzesQuery
            ->latest()
            ->paginate(
                $quizzesPerPage,
                ['*'],
                'quizzes_page',
                $quizzesPage
            );

        $quizzesData = $quizzesPageData->getCollection()->map(function (Quiz $quiz) {
            $attemptCount = (int) ($quiz->getAttribute('attempts_used') ?? 0);
            $remainingAttempts = $quiz->max_attempts
                ? max($quiz->max_attempts - $attemptCount, 0)
                : null;

            $course = $quiz->course ? $quiz->course->only(array('id', 'title')) : null;
            $lesson = $quiz->lesson ? $quiz->lesson->only(array('id', 'title')) : null;
            $status = $attemptCount > 0 ? 'attempted' : 'not_started';

            return array(
                'id' => $quiz->id,
                'title' => $quiz->title,
                'course' => $course,
                'lesson' => $lesson,
                'max_attempts' => $quiz->max_attempts,
                'attempts_used' => $attemptCount,
                'attempts_remaining' => $remainingAttempts,
                'last_score' => $quiz->getAttribute('last_score'),
                'last_attempted_at' => $quiz->getAttribute('last_attempted_at'),
                'status' => $status,
            );
        });

        $response = array(
            'data' => array(
                'assignments' => $assignmentsData,
                'quizzes' => $quizzesData
            ),
            'meta' => array(
                'assignments' => array(
                    'current_page' => $assignmentsPageData->currentPage(),
                    'per_page' => $assignmentsPageData->perPage(),
                    'total' => $assignmentsPageData->total(),
                    'last_page' => $assignmentsPageData->lastPage()
                ),
                'quizzes' => array(
                    'current_page' => $quizzesPageData->currentPage(),
                    'per_page' => $quizzesPageData->perPage(),
                    'total' => $quizzesPageData->total(),
                    'last_page' => $quizzesPageData->lastPage()
                )
            )
        );

        return response()->json($response);
    }
}
