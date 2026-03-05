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
 * @property int|null $time_limit_minutes
 * @property int|null $max_attempts
 * @property bool $is_published
 * @property \Illuminate\Support\Carbon $created_at
 * @property int|null $attempts_used
 * @property int|null $last_score
 * @property \Illuminate\Support\Carbon|null $last_attempted_at
 */

class Quiz extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'lesson_id',
        'title',
        'description',
        'time_limit_minutes',
        'max_attempts',
        'is_published',
    ];

    protected $casts = [
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

    public function questions()
    {
        return $this->hasMany(QuizQuestion::class);
    }

    public function attempts()
    {
        return $this->hasMany(QuizAttempt::class);
    }
}
