<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $courseId = $this->route('course')?->id;

        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'nullable', 'string', 'max:255', Rule::unique('courses', 'slug')->ignore($courseId)],
            'description' => ['sometimes', 'nullable', 'string'],
            'level' => ['sometimes', 'nullable', 'string', 'max:100'],
            'status' => ['sometimes', 'string', Rule::in(['draft', 'published', 'archived'])],
            'published_at' => ['sometimes', 'nullable', 'date'],
            'instructor_id' => ['sometimes', 'nullable', 'exists:users,id'],
            'thumbnail_path' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
