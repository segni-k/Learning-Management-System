<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\LessonController;
use App\Http\Controllers\Api\ModuleController;
use App\Http\Controllers\Api\AssignmentController;
use App\Http\Controllers\Api\AssignmentSubmissionController;
use App\Http\Controllers\Api\QuizAttemptController;
use App\Http\Controllers\Api\QuizController;
use App\Http\Controllers\Api\QuizQuestionController;
use App\Http\Controllers\Api\ProgressController;
use App\Http\Controllers\Api\ResourceController;
use App\Http\Controllers\Api\AdminAnalyticsController;
use App\Http\Controllers\Api\InstructorAnalyticsController;
use App\Http\Controllers\Api\StudentDashboardController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\StudentCourseworkController;
use App\Http\Controllers\Api\StudentActivityController;
use App\Http\Controllers\Api\StudentCourseDashboardController;
use App\Http\Controllers\Api\InstructorActivityController;
use App\Http\Controllers\Api\ExportController;

Route::prefix('v1')->group(function () {
    Route::middleware('web')->group(function () {
        Route::post('/auth/register', [AuthController::class, 'register']);
        Route::post('/auth/login', [AuthController::class, 'login']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
    });

    Route::middleware('auth:sanctum')->get('/auth/me', [AuthController::class, 'me']);

    Route::get('/courses', [CourseController::class, 'index']);
    Route::get('/courses/{course}', [CourseController::class, 'show']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/courses', [CourseController::class, 'store']);
        Route::patch('/courses/{course}', [CourseController::class, 'update']);
        Route::delete('/courses/{course}', [CourseController::class, 'destroy']);
        Route::get('/enrollments', [EnrollmentController::class, 'index']);
        Route::post('/courses/{course}/enroll', [EnrollmentController::class, 'store']);

        Route::post('/courses/{course}/modules', [ModuleController::class, 'store']);
        Route::patch('/modules/{module}', [ModuleController::class, 'update']);
        Route::delete('/modules/{module}', [ModuleController::class, 'destroy']);
        Route::patch('/modules/{module}/reorder', [ModuleController::class, 'reorder']);

        Route::post('/modules/{module}/lessons', [LessonController::class, 'store']);
        Route::patch('/lessons/{lesson}', [LessonController::class, 'update']);
        Route::delete('/lessons/{lesson}', [LessonController::class, 'destroy']);
        Route::patch('/modules/{module}/lessons/reorder', [LessonController::class, 'reorder']);

        Route::post('/courses/{course}/assignments', [AssignmentController::class, 'store']);
        Route::patch('/assignments/{assignment}', [AssignmentController::class, 'update']);
        Route::delete('/assignments/{assignment}', [AssignmentController::class, 'destroy']);
        Route::get('/assignments/{assignment}/submissions', [AssignmentSubmissionController::class, 'index']);
        Route::post('/assignments/{assignment}/submissions', [AssignmentSubmissionController::class, 'store']);
        Route::patch('/submissions/{submission}', [AssignmentSubmissionController::class, 'update']);
        Route::get('/submissions/{submission}/download', [AssignmentSubmissionController::class, 'download']);

        Route::post('/courses/{course}/quizzes', [QuizController::class, 'store']);
        Route::patch('/quizzes/{quiz}', [QuizController::class, 'update']);
        Route::delete('/quizzes/{quiz}', [QuizController::class, 'destroy']);
        Route::post('/quizzes/{quiz}/questions', [QuizQuestionController::class, 'store']);
        Route::patch('/questions/{question}', [QuizQuestionController::class, 'update']);
        Route::delete('/questions/{question}', [QuizQuestionController::class, 'destroy']);
        Route::patch('/quizzes/{quiz}/questions/reorder', [QuizQuestionController::class, 'reorder']);
        Route::get('/quizzes/{quiz}/attempts', [QuizAttemptController::class, 'index']);
        Route::post('/quizzes/{quiz}/attempts', [QuizAttemptController::class, 'store']);

        Route::post('/progress', [ProgressController::class, 'upsert']);
        Route::get('/courses/{course}/progress', [ProgressController::class, 'courseSummary']);
        Route::get('/courses/{course}/progress/roster', [ProgressController::class, 'courseRosterSummary']);
        Route::get('/student/resume-lesson', [ProgressController::class, 'resumeLesson']);

        Route::get('/resources', [ResourceController::class, 'index']);
        Route::post('/resources', [ResourceController::class, 'store']);
        Route::get('/resources/{resource}/download', [ResourceController::class, 'download']);

        Route::get('/admin/analytics/overview', [AdminAnalyticsController::class, 'overview']);
        Route::get('/admin/analytics/courses', [AdminAnalyticsController::class, 'courses']);
        Route::get('/admin/exports/enrollments', [ExportController::class, 'adminEnrollments']);
        Route::get('/admin/exports/progress', [ExportController::class, 'adminProgress']);

        Route::get('/instructor/analytics/overview', [InstructorAnalyticsController::class, 'overview']);
        Route::get('/instructor/analytics/courses', [InstructorAnalyticsController::class, 'courses']);
        Route::get('/instructor/activity', [InstructorActivityController::class, 'index']);
        Route::get('/instructor/exports/submissions', [ExportController::class, 'instructorSubmissions']);
        Route::get('/instructor/exports/attempts', [ExportController::class, 'instructorAttempts']);

        Route::get('/student/dashboard/overview', [StudentDashboardController::class, 'overview']);
        Route::get('/student/notifications', [NotificationController::class, 'index']);
        Route::get('/student/coursework', [StudentCourseworkController::class, 'index']);
        Route::get('/student/activity', [StudentActivityController::class, 'index']);
        Route::get('/student/courses/{course}/dashboard', [StudentCourseDashboardController::class, 'show']);
    });
});
