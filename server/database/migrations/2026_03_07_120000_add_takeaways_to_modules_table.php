<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public $withinTransaction = false;

    public function up(): void
    {
        if (! Schema::hasTable('modules') || Schema::hasColumn('modules', 'takeaways')) {
            return;
        }

        Schema::table('modules', function (Blueprint $table) {
            $table->json('takeaways')->nullable();
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('modules') || ! Schema::hasColumn('modules', 'takeaways')) {
            return;
        }

        Schema::table('modules', function (Blueprint $table) {
            $table->dropColumn('takeaways');
        });
    }
};
