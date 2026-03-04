<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $enrollments = Enrollment::query()
            ->where('user_id', $user->id)
            ->with('course.instructor')
            ->latest()
            ->get();

        return response()->json(['data' => $enrollments]);
    }

    public function store(Request $request, Course $course)
    {
        $user = $request->user();

        if (! $user?->isStudent() && ! $user?->isAdmin()) {
            abort(403, 'Only students can enroll.');
        }

        if ($course->status !== 'published') {
            abort(403, 'Course is not available for enrollment.');
        }

        $enrollment = Enrollment::firstOrCreate(
            ['course_id' => $course->id, 'user_id' => $user->id],
            ['status' => 'active', 'enrolled_at' => now()]
        );

        return response()->json(['data' => $enrollment->load('course')], 201);
    }
}
