<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateQuizRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'lesson_id' => ['sometimes', 'nullable', 'exists:lessons,id'],
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'time_limit_minutes' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'max_attempts' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
