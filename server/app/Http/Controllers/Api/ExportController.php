<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssignmentSubmission;
use App\Models\Enrollment;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExportController extends Controller
{
    public function adminEnrollments(Request $request)
    {
        $user = $request->user();

        if (! $user?->isAdmin()) {
            abort(403, 'Admins only.');
        }

        $courseId = $request->query('course_id');
        $from = $request->query('from');
        $to = $request->query('to');

        $query = Enrollment::query()
            ->with(['course', 'user'])
            ->orderBy('enrolled_at');

        if ($courseId) {
            $query->where('course_id', $courseId);
        }

        if ($from) {
            $query->where('enrolled_at', '>=', $from);
        }

        if ($to) {
            $query->where('enrolled_at', '<=', $to);
        }

        $headers = [
            'enrollment_id',
            'course_id',
            'course_title',
            'student_id',
            'student_name',
            'student_email',
            'status',
            'enrolled_at',
            'completed_at',
        ];

        return $this->streamCsv('admin-enrollments.csv', $headers, function () use ($query) {
            foreach ($query->cursor() as $enrollment) {
                yield [
                    $enrollment->id,
                    $enrollment->course_id,
                    $enrollment->course?->title,
                    $enrollment->user_id,
                    $enrollment->user?->name,
                    $enrollment->user?->email,
                    $enrollment->status,
                    $enrollment->enrolled_at,
                    $enrollment->completed_at,
                ];
            }
        });
    }

    public function adminProgress(Request $request)
    {
        $user = $request->user();

        if (! $user?->isAdmin()) {
            abort(403, 'Admins only.');
        }

        $courseId = $request->query('course_id');

        $query = DB::table('lesson_progress')
            ->join('lessons', 'lesson_progress.lesson_id', '=', 'lessons.id')
            ->join('modules', 'lessons.module_id', '=', 'modules.id')
            ->join('courses', 'modules.course_id', '=', 'courses.id')
            ->join('users', 'lesson_progress.user_id', '=', 'users.id')
            ->select([
                'lesson_progress.user_id',
                'users.name as user_name',
                'users.email as user_email',
                'courses.id as course_id',
                'courses.title as course_title',
                'lessons.id as lesson_id',
                'lessons.title as lesson_title',
                'lesson_progress.status',
                'lesson_progress.progress_percent',
                'lesson_progress.completed_at',
                'lesson_progress.updated_at',
            ])
            ->orderBy('lesson_progress.updated_at');

        if ($courseId) {
            $query->where('courses.id', $courseId);
        }

        $headers = [
            'student_id',
            'student_name',
            'student_email',
            'course_id',
            'course_title',
            'lesson_id',
            'lesson_title',
            'status',
            'progress_percent',
            'completed_at',
            'updated_at',
        ];

        return $this->streamCsv('admin-progress.csv', $headers, function () use ($query) {
            foreach ($query->cursor() as $row) {
                yield [
                    $row->user_id,
                    $row->user_name,
                    $row->user_email,
                    $row->course_id,
                    $row->course_title,
                    $row->lesson_id,
                    $row->lesson_title,
                    $row->status,
                    $row->progress_percent,
                    $row->completed_at,
                    $row->updated_at,
                ];
            }
        });
    }

    public function instructorSubmissions(Request $request)
    {
        $user = $request->user();

        if (! $user?->isInstructor() && ! $user?->isAdmin()) {
            abort(403, 'Instructors only.');
        }

        $courseId = $request->query('course_id');
        $from = $request->query('from');
        $to = $request->query('to');

        $query = AssignmentSubmission::query()
            ->with(['assignment.course', 'assignment.lesson', 'user'])
            ->whereHas('assignment.course', function ($builder) use ($user) {
                if (! $user->isAdmin()) {
                    $builder->where('instructor_id', $user->id);
                }
            })
            ->orderBy('submitted_at');

        if ($courseId) {
            $query->whereHas('assignment', function ($builder) use ($courseId) {
                $builder->where('course_id', $courseId);
            });
        }

        if ($from) {
            $query->where('submitted_at', '>=', $from);
        }

        if ($to) {
            $query->where('submitted_at', '<=', $to);
        }

        $headers = [
            'submission_id',
            'assignment_id',
            'assignment_title',
            'course_id',
            'course_title',
            'student_id',
            'student_name',
            'student_email',
            'submitted_at',
            'graded_at',
            'score',
        ];

        return $this->streamCsv('instructor-submissions.csv', $headers, function () use ($query) {
            foreach ($query->cursor() as $submission) {
                yield [
                    $submission->id,
                    $submission->assignment_id,
                    $submission->assignment?->title,
                    $submission->assignment?->course?->id,
                    $submission->assignment?->course?->title,
                    $submission->user_id,
                    $submission->user?->name,
                    $submission->user?->email,
                    $submission->submitted_at,
                    $submission->graded_at,
                    $submission->score,
                ];
            }
        });
    }

    public function instructorAttempts(Request $request)
    {
        $user = $request->user();

        if (! $user?->isInstructor() && ! $user?->isAdmin()) {
            abort(403, 'Instructors only.');
        }

        $courseId = $request->query('course_id');
        $from = $request->query('from');
        $to = $request->query('to');

        $query = QuizAttempt::query()
            ->with(['quiz.course', 'quiz.lesson', 'user'])
            ->whereHas('quiz.course', function ($builder) use ($user) {
                if (! $user->isAdmin()) {
                    $builder->where('instructor_id', $user->id);
                }
            })
            ->orderBy('completed_at');

        if ($courseId) {
            $query->whereHas('quiz', function ($builder) use ($courseId) {
                $builder->where('course_id', $courseId);
            });
        }

        if ($from) {
            $query->where('completed_at', '>=', $from);
        }

        if ($to) {
            $query->where('completed_at', '<=', $to);
        }

        $headers = [
            'attempt_id',
            'quiz_id',
            'quiz_title',
            'course_id',
            'course_title',
            'student_id',
            'student_name',
            'student_email',
            'completed_at',
            'score',
        ];

        return $this->streamCsv('instructor-attempts.csv', $headers, function () use ($query) {
            foreach ($query->cursor() as $attempt) {
                yield [
                    $attempt->id,
                    $attempt->quiz_id,
                    $attempt->quiz?->title,
                    $attempt->quiz?->course?->id,
                    $attempt->quiz?->course?->title,
                    $attempt->user_id,
                    $attempt->user?->name,
                    $attempt->user?->email,
                    $attempt->completed_at,
                    $attempt->score,
                ];
            }
        });
    }

    private function streamCsv(string $filename, array $headers, callable $rows)
    {
        return response()->streamDownload(function () use ($headers, $rows) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $headers);
            foreach ($rows() as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
