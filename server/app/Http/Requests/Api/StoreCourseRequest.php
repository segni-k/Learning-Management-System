<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:courses,slug'],
            'description' => ['nullable', 'string'],
            'level' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', Rule::in(['draft', 'published', 'archived'])],
            'published_at' => ['nullable', 'date'],
            'instructor_id' => ['nullable', 'exists:users,id'],
            'thumbnail_path' => ['nullable', 'string', 'max:255'],
        ];
    }
}
