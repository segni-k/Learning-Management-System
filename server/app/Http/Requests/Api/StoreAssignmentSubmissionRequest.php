<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StoreAssignmentSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content' => ['nullable', 'string'],
            'file_path' => ['nullable', 'string', 'max:255'],
            'file' => ['nullable', 'file', 'max:20480'],
        ];
    }
}
