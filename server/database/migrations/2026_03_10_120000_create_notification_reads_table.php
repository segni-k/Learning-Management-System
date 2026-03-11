<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('notification_type', 50);
            $table->unsignedBigInteger('notification_id');
            $table->timestamp('read_at');
            $table->timestamps();

            $table->unique(['user_id', 'notification_type', 'notification_id'], 'notification_reads_unique');
            $table->index(['user_id', 'notification_type', 'read_at'], 'notification_reads_user_type_read_idx');
        });

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

        if (Schema::hasTable('lessons')) {
            Schema::table('lessons', function (Blueprint $table) {
                $table->index(['module_id', 'is_published', 'created_at'], 'lessons_module_published_created_idx');
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

        if (Schema::hasTable('lessons')) {
            Schema::table('lessons', function (Blueprint $table) {
                $table->dropIndex('lessons_module_published_created_idx');
            });
        }

        Schema::dropIfExists('notification_reads');
    }
};
