<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLessonProgressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'lesson_id' => ['required', 'integer', 'exists:lessons,id'],
            'status' => ['required', 'string', Rule::in(['not_started', 'in_progress', 'completed'])],
            'progress_percent' => ['required', 'integer', 'min:0', 'max:100'],
        ];
    }
}
