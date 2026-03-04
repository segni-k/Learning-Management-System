<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateQuizQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'question_text' => ['sometimes', 'string'],
            'question_type' => ['sometimes', 'string', Rule::in(['multiple_choice', 'single_choice', 'true_false', 'essay'])],
            'options' => ['sometimes', 'nullable', 'array'],
            'correct_answer' => ['sometimes', 'nullable', 'array'],
            'points' => ['sometimes', 'integer', 'min:1'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
