<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreCourseRequest;
use App\Http\Requests\Api\UpdateCourseRequest;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Course::query()
            ->select([
                'id',
                'title',
                'slug',
                'description',
                'level',
                'status',
                'published_at',
                'thumbnail_path',
                'instructor_id',
                'created_at',
            ])
            ->with(['instructor:id,name,email']);

        if ($user?->isAdmin()) {
            return response()->json(['data' => $query->latest()->get()]);
        }

        if ($user?->isInstructor()) {
            return response()->json([
                'data' => $query->where('instructor_id', $user->id)->latest()->get(),
            ]);
        }

        return response()->json([
            'data' => $query->where('status', 'published')->latest()->get(),
        ]);
    }

    public function show(Request $request, Course $course)
    {
        $user = $request->user();

        if ($course->status !== 'published') {
            $isOwner = $user && ($user->isAdmin() || $course->instructor_id === $user->id);
            if (! $isOwner) {
                abort(404);
            }
        }

        $course->load([
            'instructor:id,name,email',
            'modules' => function ($query) {
                $query->select(['id', 'course_id', 'title', 'description', 'takeaways', 'sort_order'])
                    ->orderBy('sort_order');
            },
            'modules.lessons' => function ($query) {
                $query->select([
                    'id',
                    'module_id',
                    'title',
                    'content',
                    'video_url',
                    'duration_seconds',
                    'sort_order',
                    'is_published',
                ])->orderBy('sort_order');
            },
            'assignments' => function ($query) {
                $query->select([
                    'id',
                    'course_id',
                    'lesson_id',
                    'title',
                    'description',
                    'due_at',
                    'max_points',
                    'is_published',
                    'created_at',
                ])->orderBy('due_at');
            },
            'quizzes' => function ($query) {
                $query->select([
                    'id',
                    'course_id',
                    'lesson_id',
                    'title',
                    'description',
                    'time_limit_minutes',
                    'max_attempts',
                    'is_published',
                    'created_at',
                ])->orderByDesc('created_at');
            },
        ]);

        return response()->json(['data' => $course]);
    }

    public function store(StoreCourseRequest $request)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && ! $user?->isInstructor()) {
            abort(403, 'Only admins and instructors can create courses.');
        }

        $data = $request->validated();
        $data['slug'] = $data['slug'] ?? $this->generateUniqueSlug($data['title']);

        if (! $user->isAdmin()) {
            $data['instructor_id'] = $user->id;
        }

        if (($data['status'] ?? 'draft') === 'published' && empty($data['published_at'])) {
            $data['published_at'] = now();
        }

        $course = Course::create($data);

        return response()->json(['data' => $course], 201);
    }

    public function update(UpdateCourseRequest $request, Course $course)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && $course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to update this course.');
        }

        $data = $request->validated();

        if (array_key_exists('slug', $data) && empty($data['slug'])) {
            $data['slug'] = $this->generateUniqueSlug($data['title'] ?? $course->title, $course->id);
        }

        if (($data['status'] ?? $course->status) === 'published' && empty($course->published_at)) {
            $data['published_at'] = $data['published_at'] ?? now();
        }

        $course->update($data);

        return response()->json(['data' => $course->fresh('instructor')]);
    }

    public function destroy(Request $request, Course $course)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && $course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to delete this course.');
        }

        $course->delete();

        return response()->json(['message' => 'Course deleted']);
    }

    private function generateUniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $counter = 2;

        $query = Course::query();
        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }

        while ($query->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$counter;
            $counter++;
        }

        return $slug;
    }
}
