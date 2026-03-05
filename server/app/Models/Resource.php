<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int|null $course_id
 * @property int|null $lesson_id
 * @property int $uploaded_by
 * @property string $title
 * @property string $type
 * @property string $path
 * @property bool $is_private
 */

class Resource extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'lesson_id',
        'uploaded_by',
        'title',
        'type',
        'path',
        'is_private',
    ];

    protected $casts = [
        'is_private' => 'boolean',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
