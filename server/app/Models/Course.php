<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int|null $instructor_id
 * @property string $title
 * @property string $slug
 * @property string|null $description
 * @property string|null $level
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $published_at
 * @property string|null $thumbnail_path
 */

class Course extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'level',
        'status',
        'published_at',
        'instructor_id',
        'thumbnail_path',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    public function instructor()
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function modules()
    {
        return $this->hasMany(Module::class);
    }

    public function lessons()
    {
        return $this->hasManyThrough(Lesson::class, Module::class);
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function assignments()
    {
        return $this->hasMany(Assignment::class);
    }

    public function quizzes()
    {
        return $this->hasMany(Quiz::class);
    }

    public function resources()
    {
        return $this->hasMany(Resource::class);
    }
}
