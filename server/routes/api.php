<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\EnrollmentController;

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
    });
});
