<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public $withinTransaction = false;

    public function up(): void
    {
        if (Schema::hasTable('assignments')) {
            Schema::table('assignments', function (Blueprint $table) {
                $table->index(['course_id', 'is_published', 'due_at'], 'assignments_course_published_due_idx');
            });
        }

        if (Schema::hasTable('quizzes')) {
            Schema::table('quizzes', function (Blueprint $table) {
                $table->index(['course_id', 'is_published', 'created_at'], 'quizzes_course_published_created_idx');
            });
        }

        if (Schema::hasTable('lesson_progress')) {
            Schema::table('lesson_progress', function (Blueprint $table) {
                $table->index(['user_id', 'status', 'updated_at'], 'lesson_progress_user_status_updated_idx');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('assignments')) {
            Schema::table('assignments', function (Blueprint $table) {
                $table->dropIndex('assignments_course_published_due_idx');
            });
        }

        if (Schema::hasTable('quizzes')) {
            Schema::table('quizzes', function (Blueprint $table) {
                $table->dropIndex('quizzes_course_published_created_idx');
            });
        }

        if (Schema::hasTable('lesson_progress')) {
            Schema::table('lesson_progress', function (Blueprint $table) {
                $table->dropIndex('lesson_progress_user_status_updated_idx');
            });
        }
    }
};
