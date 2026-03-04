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

    public function download(Request $request, Resource $resource)
    {
        $user = $request->user();

        if (! $user) {
            abort(403, 'Authentication required.');
        }

        if ($user->isAdmin()) {
            return $this->downloadResourceFile($resource);
        }

        $courseId = $resource->course_id;
        if (! $courseId && $resource->lesson) {
            $courseId = $resource->lesson?->module?->course_id;
        }

        if ($user->isInstructor() && $courseId) {
            $isOwner = $resource->course?->instructor_id === $user->id
                || $resource->lesson?->module?->course?->instructor_id === $user->id;

            if ($isOwner) {
                return $this->downloadResourceFile($resource);
            }
        }

        if ($user->isStudent()) {
            if (! $courseId) {
                abort(403, 'You do not have access to this resource.');
            }

            $isEnrolled = Enrollment::query()
                ->where('course_id', $courseId)
                ->where('user_id', $user->id)
                ->exists();

            if ($isEnrolled) {
                return $this->downloadResourceFile($resource);
            }
        }

        abort(403, 'You do not have access to this resource.');
    }

    private function downloadResourceFile(Resource $resource)
    {
        if (! $resource->path) {
            abort(404, 'File not found.');
        }

        return Storage::disk('public')->download($resource->path);
    }
}
