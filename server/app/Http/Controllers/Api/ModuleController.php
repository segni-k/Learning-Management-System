<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreModuleRequest;
use App\Http\Requests\Api\UpdateModuleRequest;
use App\Models\Course;
use App\Models\Module;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ModuleController extends Controller
{
    public function store(StoreModuleRequest $request, Course $course)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && $course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to add modules to this course.');
        }

        $data = $request->validated();
        $data['course_id'] = $course->id;

        if (! array_key_exists('sort_order', $data)) {
            $data['sort_order'] = (int) $course->modules()->max('sort_order') + 1;
        }

        $module = Module::create($data);

        return response()->json(['data' => $module], 201);
    }

    public function update(UpdateModuleRequest $request, Module $module)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && $module->course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to update this module.');
        }

        $module->update($request->validated());

        return response()->json(['data' => $module->fresh()]);
    }

    public function destroy(Request $request, Module $module)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && $module->course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to delete this module.');
        }

        $module->delete();

        return response()->json(['message' => 'Module deleted']);
    }

    public function reorder(Request $request, Module $module)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && $module->course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to reorder modules for this course.');
        }

        $data = $request->validate([
            'ordered_ids' => ['required', 'array', 'min:1'],
            'ordered_ids.*' => ['integer'],
        ]);

        $course = $module->course;
        $existingIds = $course->modules()->pluck('id')->all();
        $orderedIds = $data['ordered_ids'];

        if (count($orderedIds) !== count($existingIds) || array_diff($existingIds, $orderedIds)) {
            abort(422, 'ordered_ids must include all module ids for this course.');
        }

        DB::transaction(function () use ($orderedIds) {
            foreach ($orderedIds as $index => $id) {
                Module::where('id', $id)->update(['sort_order' => $index + 1]);
            }
        });

        return response()->json(['message' => 'Modules reordered']);
    }
}
