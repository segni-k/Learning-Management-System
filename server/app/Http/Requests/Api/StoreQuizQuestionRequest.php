<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreQuizQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'question_text' => ['required', 'string'],
            'question_type' => ['required', 'string', Rule::in(['multiple_choice', 'single_choice', 'true_false', 'essay'])],
            'options' => ['nullable', 'array'],
            'correct_answer' => ['nullable', 'array'],
            'points' => ['nullable', 'integer', 'min:1'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
