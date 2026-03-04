<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreAssignmentRequest;
use App\Http\Requests\Api\UpdateAssignmentRequest;
use App\Models\Assignment;
use App\Models\Course;
use Illuminate\Http\Request;

class AssignmentController extends Controller
{
    public function store(StoreAssignmentRequest $request, Course $course)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && $course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to create assignments for this course.');
        }

        $data = $request->validated();
        $data['course_id'] = $course->id;

        $assignment = Assignment::create($data);

        return response()->json(['data' => $assignment], 201);
    }

    public function update(UpdateAssignmentRequest $request, Assignment $assignment)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && $assignment->course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to update this assignment.');
        }

        $assignment->update($request->validated());

        return response()->json(['data' => $assignment->fresh()]);
    }

    public function destroy(Request $request, Assignment $assignment)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && $assignment->course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to delete this assignment.');
        }

        $assignment->delete();

        return response()->json(['message' => 'Assignment deleted']);
    }
}
