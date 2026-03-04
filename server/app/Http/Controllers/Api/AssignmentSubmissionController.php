<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreAssignmentSubmissionRequest;
use App\Http\Requests\Api\UpdateAssignmentSubmissionRequest;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AssignmentSubmissionController extends Controller
{
    public function store(StoreAssignmentSubmissionRequest $request, Assignment $assignment)
    {
        $user = $request->user();

        if (! $user?->isStudent()) {
            abort(403, 'Only students can submit assignments.');
        }

        $data = $request->validated();

        if ($request->hasFile('file')) {
            $data['file_path'] = $request->file('file')->store('assignment-submissions', 'public');
        }

        $data['user_id'] = $user->id;
        $data['submitted_at'] = now();

        $submission = AssignmentSubmission::updateOrCreate(
            ['assignment_id' => $assignment->id, 'user_id' => $user->id],
            $data
        );

        return response()->json(['data' => $submission->fresh()], 201);
    }

    public function update(UpdateAssignmentSubmissionRequest $request, AssignmentSubmission $submission)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && $submission->assignment->course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to grade this submission.');
        }

        $data = $request->validated();
        $data['graded_at'] = now();

        $submission->update($data);

        return response()->json(['data' => $submission->fresh()]);
    }

    public function index(Request $request, Assignment $assignment)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && $assignment->course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to view submissions for this assignment.');
        }

        $submissions = AssignmentSubmission::query()
            ->where('assignment_id', $assignment->id)
            ->with('user')
            ->latest()
            ->get();

        return response()->json(['data' => $submissions]);
    }
}
