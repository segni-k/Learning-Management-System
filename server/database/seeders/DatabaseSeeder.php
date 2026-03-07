<?php

namespace Database\Seeders;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Module;
use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use App\Models\Resource;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@atlas.test',
            'role' => User::ROLE_ADMIN,
            'password' => Hash::make('password'),
        ]);

        $instructors = User::factory(5)->create([
            'role' => User::ROLE_INSTRUCTOR,
        ]);

        $students = User::factory(50)->create([
            'role' => User::ROLE_STUDENT,
        ]);

        $courseLessons = [];
        $courseAssignments = [];
        $courseQuizzes = [];

        for ($i = 1; $i <= 10; $i++) {
            $title = fake()->sentence(3);
            $course = Course::create([
                'title' => $title,
                'slug' => Str::slug($title)."-{$i}",
                'description' => fake()->paragraph(),
                'level' => fake()->randomElement(['beginner', 'intermediate', 'advanced']),
                'status' => 'published',
                'published_at' => now()->subDays(fake()->numberBetween(1, 90)),
                'instructor_id' => $instructors->random()->id,
            ]);

            $lessons = collect();
            $modulesCount = fake()->numberBetween(3, 5);
            for ($m = 1; $m <= $modulesCount; $m++) {
                $module = Module::create([
                    'course_id' => $course->id,
                    'title' => "Module {$m}: ".fake()->words(2, true),
                    'description' => fake()->sentence(),
                    'sort_order' => $m,
                ]);

                $lessonCount = fake()->numberBetween(4, 6);
                for ($l = 1; $l <= $lessonCount; $l++) {
                    $lessons->push(Lesson::create([
                        'module_id' => $module->id,
                        'title' => "Lesson {$l}: ".fake()->words(3, true),
                        'content' => fake()->paragraphs(3, true),
                        'video_url' => fake()->boolean(40) ? 'https://www.youtube.com/embed/dQw4w9WgXcQ' : null,
                        'duration_seconds' => fake()->numberBetween(300, 1800),
                        'sort_order' => $l,
                        'is_published' => true,
                    ]));
                }
            }

            $assignments = collect();
            $assignmentsCount = fake()->numberBetween(2, 4);
            for ($a = 1; $a <= $assignmentsCount; $a++) {
                $assignmentLesson = fake()->boolean(60) ? $lessons->random() : null;
                $assignments->push(Assignment::create([
                    'course_id' => $course->id,
                    'lesson_id' => $assignmentLesson?->id,
                    'title' => "Assignment {$a}: ".fake()->words(3, true),
                    'description' => fake()->paragraph(),
                    'due_at' => now()->addDays(fake()->numberBetween(3, 30)),
                    'max_points' => fake()->numberBetween(50, 100),
                    'is_published' => true,
                ]));
            }

            $quizzes = collect();
            $quizCount = fake()->numberBetween(2, 3);
            for ($q = 1; $q <= $quizCount; $q++) {
                $quizLesson = fake()->boolean(50) ? $lessons->random() : null;
                $quiz = Quiz::create([
                    'course_id' => $course->id,
                    'lesson_id' => $quizLesson?->id,
                    'title' => "Quiz {$q}: ".fake()->words(3, true),
                    'description' => fake()->sentence(),
                    'time_limit_minutes' => fake()->randomElement([20, 30, 45, null]),
                    'max_attempts' => fake()->randomElement([1, 2, 3]),
                    'is_published' => true,
                ]);
                $quizzes->push($quiz);

                $questionCount = fake()->numberBetween(4, 6);
                for ($k = 1; $k <= $questionCount; $k++) {
                    $type = fake()->randomElement(['multiple_choice', 'single_choice', 'true_false']);
                    $options = $type === 'true_false'
                        ? ['true', 'false']
                        : [fake()->word(), fake()->word(), fake()->word(), fake()->word()];
                    $correct = $type === 'multiple_choice'
                        ? [fake()->randomElement($options)]
                        : [fake()->randomElement($options)];

                    QuizQuestion::create([
                        'quiz_id' => $quiz->id,
                        'question_text' => fake()->sentence(),
                        'question_type' => $type,
                        'options' => $options,
                        'correct_answer' => $correct,
                        'points' => fake()->numberBetween(1, 5),
                        'sort_order' => $k,
                    ]);
                }
            }

            Resource::create([
                'course_id' => $course->id,
                'lesson_id' => null,
                'uploaded_by' => $course->instructor_id,
                'title' => 'Course syllabus',
                'type' => 'file',
                'path' => 'resources/sample-syllabus.pdf',
                'is_private' => true,
            ]);

            $lessons->random(fake()->numberBetween(1, 2))->each(function (Lesson $lesson) use ($course) {
                Resource::create([
                    'course_id' => $course->id,
                    'lesson_id' => $lesson->id,
                    'uploaded_by' => $course->instructor_id,
                    'title' => 'Lesson worksheet',
                    'type' => 'worksheet',
                    'path' => 'resources/sample-worksheet.pdf',
                    'is_private' => true,
                ]);
            });

            $courseLessons[$course->id] = $lessons;
            $courseAssignments[$course->id] = $assignments;
            $courseQuizzes[$course->id] = $quizzes;
        }

        foreach ($students as $student) {
            $enrolledCourses = collect($courseLessons)->keys()->random(fake()->numberBetween(2, 4));
            foreach ($enrolledCourses as $courseId) {
                $enrollment = Enrollment::firstOrCreate([
                    'course_id' => $courseId,
                    'user_id' => $student->id,
                ], [
                    'status' => 'active',
                    'enrolled_at' => now()->subDays(fake()->numberBetween(1, 60)),
                ]);

                $lessons = $courseLessons[$courseId];
                $lessons->random(fake()->numberBetween(3, min(6, $lessons->count())))
                    ->each(function (Lesson $lesson) use ($student) {
                        $completed = fake()->boolean(50);
                        LessonProgress::updateOrCreate([
                            'lesson_id' => $lesson->id,
                            'user_id' => $student->id,
                        ], [
                            'status' => $completed ? 'completed' : 'in_progress',
                            'progress_percent' => $completed ? 100 : fake()->numberBetween(20, 90),
                            'completed_at' => $completed ? now()->subDays(fake()->numberBetween(1, 30)) : null,
                        ]);
                    });

                $assignments = $courseAssignments[$courseId];
                $assignments->random(fake()->numberBetween(1, min(3, $assignments->count())))
                    ->each(function (Assignment $assignment) use ($student) {
                        $graded = fake()->boolean(60);
                        AssignmentSubmission::create([
                            'assignment_id' => $assignment->id,
                            'user_id' => $student->id,
                            'content' => fake()->sentence(),
                            'submitted_at' => now()->subDays(fake()->numberBetween(1, 14)),
                            'graded_at' => $graded ? now()->subDays(fake()->numberBetween(0, 7)) : null,
                            'score' => $graded ? fake()->numberBetween(60, $assignment->max_points) : null,
                            'feedback' => $graded ? fake()->sentence() : null,
                        ]);
                    });

                $quizzes = $courseQuizzes[$courseId];
                $quizzes->random(fake()->numberBetween(1, min(2, $quizzes->count())))
                    ->each(function (Quiz $quiz) use ($student) {
                        $attempt = QuizAttempt::create([
                            'quiz_id' => $quiz->id,
                            'user_id' => $student->id,
                            'started_at' => now()->subDays(fake()->numberBetween(1, 20)),
                            'completed_at' => now()->subDays(fake()->numberBetween(0, 10)),
                            'score' => 0,
                        ]);

                        $score = 0;
                        foreach ($quiz->questions as $question) {
                            $isCorrect = fake()->boolean(70);
                            $answer = $isCorrect ? $question->correct_answer : [fake()->word()];
                            $pointsAwarded = $isCorrect ? $question->points : 0;
                            $score += $pointsAwarded;

                            QuizAnswer::create([
                                'quiz_attempt_id' => $attempt->id,
                                'quiz_question_id' => $question->id,
                                'answer' => $answer,
                                'is_correct' => $isCorrect,
                                'points_awarded' => $pointsAwarded,
                            ]);
                        }

                        $attempt->update(['score' => $score]);
                    });
            }
        }
    }
}
