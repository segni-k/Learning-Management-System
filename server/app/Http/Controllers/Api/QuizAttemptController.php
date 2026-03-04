<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreQuizAttemptRequest;
use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuizAttemptController extends Controller
{
    public function store(StoreQuizAttemptRequest $request, Quiz $quiz)
    {
        $user = $request->user();

        if (! $user?->isStudent()) {
            abort(403, 'Only students can attempt quizzes.');
        }

        $data = $request->validated();

        $attemptCount = QuizAttempt::query()
            ->where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)
            ->count();

        if ($quiz->max_attempts && $attemptCount >= $quiz->max_attempts) {
            abort(403, 'Maximum quiz attempts reached.');
        }

        $result = DB::transaction(function () use ($quiz, $user, $data) {
            $attempt = QuizAttempt::create([
                'quiz_id' => $quiz->id,
                'user_id' => $user->id,
                'started_at' => now(),
                'completed_at' => now(),
                'score' => 0,
            ]);

            $score = 0;
            foreach ($data['answers'] as $answerPayload) {
                $question = QuizQuestion::query()
                    ->where('quiz_id', $quiz->id)
                    ->where('id', $answerPayload['question_id'])
                    ->firstOrFail();

                $isCorrect = null;
                $pointsAwarded = null;

                if ($question->question_type !== 'essay') {
                    $isCorrect = $answerPayload['answer'] === $question->correct_answer;
                    $pointsAwarded = $isCorrect ? $question->points : 0;
                    $score += $pointsAwarded;
                }

                QuizAnswer::create([
                    'quiz_attempt_id' => $attempt->id,
                    'quiz_question_id' => $question->id,
                    'answer' => $answerPayload['answer'],
                    'is_correct' => $isCorrect,
                    'points_awarded' => $pointsAwarded,
                ]);
            }

            $attempt->update(['score' => $score]);

            return $attempt->fresh(['answers.question']);
        });

        return response()->json(['data' => $result], 201);
    }

    public function index(Request $request, Quiz $quiz)
    {
        $user = $request->user();

        if ($user?->isStudent()) {
            $attempts = QuizAttempt::query()
                ->where('quiz_id', $quiz->id)
                ->where('user_id', $user->id)
                ->latest()
                ->get();

            return response()->json(['data' => $attempts]);
        }

        if (! $user?->isAdmin() && $quiz->course->instructor_id !== $user?->id) {
            abort(403, 'You do not have permission to view attempts for this quiz.');
        }

        $attempts = QuizAttempt::query()
            ->where('quiz_id', $quiz->id)
            ->with('user')
            ->latest()
            ->get();

        return response()->json(['data' => $attempts]);
    }
}
