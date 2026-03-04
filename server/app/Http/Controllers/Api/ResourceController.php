<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreResourceRequest;
use App\Models\Enrollment;
use App\Models\Resource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ResourceController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Resource::query()->with(['course', 'lesson']);

        $courseId = $request->query('course_id');
        $lessonId = $request->query('lesson_id');

        if ($courseId) {
            $query->where('course_id', $courseId);
        }

        if ($lessonId) {
            $query->where('lesson_id', $lessonId);
        }

        if ($user?->isAdmin()) {
            return response()->json(['data' => $query->latest()->get()]);
        }

        if ($user?->isInstructor()) {
            $query->whereHas('course', function ($builder) use ($user) {
                $builder->where('instructor_id', $user->id);
            });

            return response()->json(['data' => $query->latest()->get()]);
        }

        if (! $user?->isStudent()) {
            abort(403, 'You do not have permission to view resources.');
        }

        if ($courseId) {
            $isEnrolled = Enrollment::query()
                ->where('course_id', $courseId)
                ->where('user_id', $user->id)
                ->exists();

            if (! $isEnrolled) {
                abort(403, 'You are not enrolled in this course.');
            }
        } else {
            $courseIds = Enrollment::query()
                ->where('user_id', $user->id)
                ->pluck('course_id');

            $query->whereIn('course_id', $courseIds);
        }

        return response()->json(['data' => $query->latest()->get()]);
    }

    public function store(StoreResourceRequest $request)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && ! $user?->isInstructor()) {
            abort(403, 'Only admins and instructors can upload resources.');
        }

        $data = $request->validated();

        if (! $request->hasFile('file')) {
            abort(422, 'File is required.');
        }

        $path = $request->file('file')->store('resources', 'public');

        $resource = Resource::create([
            'course_id' => $data['course_id'] ?? null,
            'lesson_id' => $data['lesson_id'] ?? null,
            'uploaded_by' => $user->id,
            'title' => $data['title'],
            'type' => $data['type'],
            'path' => $path,
            'is_private' => $data['is_private'] ?? true,
        ]);

        return response()->json([
            'data' => $resource,
            'url' => Storage::disk('public')->url($path),
        ], 201);
    }
}
