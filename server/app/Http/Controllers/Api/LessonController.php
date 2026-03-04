<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreLessonRequest;
use App\Http\Requests\Api\UpdateLessonRequest;
use App\Models\Lesson;
use App\Models\Module;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LessonController extends Controller
{
    public function store(StoreLessonRequest $request, Module $module)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && $module->course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to add lessons to this module.');
        }

        $data = $request->validated();
        $data['module_id'] = $module->id;

        if (! array_key_exists('sort_order', $data)) {
            $data['sort_order'] = (int) $module->lessons()->max('sort_order') + 1;
        }

        $lesson = Lesson::create($data);

        return response()->json(['data' => $lesson], 201);
    }

    public function update(UpdateLessonRequest $request, Lesson $lesson)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && $lesson->module->course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to update this lesson.');
        }

        $lesson->update($request->validated());

        return response()->json(['data' => $lesson->fresh()]);
    }

    public function destroy(Request $request, Lesson $lesson)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && $lesson->module->course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to delete this lesson.');
        }

        $lesson->delete();

        return response()->json(['message' => 'Lesson deleted']);
    }

    public function reorder(Request $request, Module $module)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && $module->course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to reorder lessons for this module.');
        }

        $data = $request->validate([
            'ordered_ids' => ['required', 'array', 'min:1'],
            'ordered_ids.*' => ['integer'],
        ]);

        $existingIds = $module->lessons()->pluck('id')->all();
        $orderedIds = $data['ordered_ids'];

        if (count($orderedIds) !== count($existingIds) || array_diff($existingIds, $orderedIds)) {
            abort(422, 'ordered_ids must include all lesson ids for this module.');
        }

        DB::transaction(function () use ($orderedIds) {
            foreach ($orderedIds as $index => $id) {
                Lesson::where('id', $id)->update(['sort_order' => $index + 1]);
            }
        });

        return response()->json(['message' => 'Lessons reordered']);
    }
}
