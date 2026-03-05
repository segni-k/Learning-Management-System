<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $course_id
 * @property int|null $lesson_id
 * @property string $title
 * @property string|null $description
 * @property \Illuminate\Support\Carbon|null $due_at
 * @property int $max_points
 * @property bool $is_published
 * @property int|null $submission_id
 * @property \Illuminate\Support\Carbon|null $submission_submitted_at
 * @property \Illuminate\Support\Carbon|null $submission_graded_at
 * @property int|null $submission_score
 */

class Assignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'lesson_id',
        'title',
        'description',
        'due_at',
        'max_points',
        'is_published',
    ];

    protected $casts = [
        'due_at' => 'datetime',
        'is_published' => 'boolean',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    public function submissions()
    {
        return $this->hasMany(AssignmentSubmission::class);
    }
}
