<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreQuizQuestionRequest;
use App\Http\Requests\Api\UpdateQuizQuestionRequest;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuizQuestionController extends Controller
{
    public function index(Request $request, Quiz $quiz)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && $quiz->course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to view questions for this quiz.');
        }

        $questions = $quiz->questions()->orderBy('sort_order')->get();

        return response()->json(['data' => $questions]);
    }

    public function store(StoreQuizQuestionRequest $request, Quiz $quiz)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && $quiz->course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to add questions to this quiz.');
        }

        $data = $request->validated();
        $data['quiz_id'] = $quiz->id;

        if (! array_key_exists('sort_order', $data)) {
            $data['sort_order'] = (int) $quiz->questions()->max('sort_order') + 1;
        }

        $question = QuizQuestion::create($data);

        return response()->json(['data' => $question], 201);
    }

    public function update(UpdateQuizQuestionRequest $request, QuizQuestion $question)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && $question->quiz->course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to update this question.');
        }

        $question->update($request->validated());

        return response()->json(['data' => $question->fresh()]);
    }

    public function destroy(Request $request, QuizQuestion $question)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && $question->quiz->course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to delete this question.');
        }

        $question->delete();

        return response()->json(['message' => 'Question deleted']);
    }

    public function reorder(Request $request, Quiz $quiz)
    {
        $user = $request->user();

        if (! $user?->isAdmin() && $quiz->course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to reorder questions for this quiz.');
        }

        $data = $request->validate([
            'ordered_ids' => ['required', 'array', 'min:1'],
            'ordered_ids.*' => ['integer'],
        ]);

        $existingIds = $quiz->questions()->pluck('id')->all();
        $orderedIds = $data['ordered_ids'];

        if (count($orderedIds) !== count($existingIds) || array_diff($existingIds, $orderedIds)) {
            abort(422, 'ordered_ids must include all question ids for this quiz.');
        }

        DB::transaction(function () use ($orderedIds) {
            foreach ($orderedIds as $index => $id) {
                QuizQuestion::where('id', $id)->update(['sort_order' => $index + 1]);
            }
        });

        return response()->json(['message' => 'Questions reordered']);
    }
}
