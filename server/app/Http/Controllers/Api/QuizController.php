<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreQuizRequest;
use App\Http\Requests\Api\UpdateQuizRequest;
use App\Models\Course;
use App\Models\Quiz;
use Illuminate\Http\Request;

class QuizController extends Controller
{
    public function store(StoreQuizRequest $request, Course $course)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && $course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to create quizzes for this course.');
        }

        $data = $request->validated();
        $data['course_id'] = $course->id;

        $quiz = Quiz::create($data);

        return response()->json(['data' => $quiz], 201);
    }

    public function update(UpdateQuizRequest $request, Quiz $quiz)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && $quiz->course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to update this quiz.');
        }

        $quiz->update($request->validated());

        return response()->json(['data' => $quiz->fresh()]);
    }

    public function destroy(Request $request, Quiz $quiz)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && $quiz->course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to delete this quiz.');
        }

        $quiz->delete();

        return response()->json(['message' => 'Quiz deleted']);
    }
}
