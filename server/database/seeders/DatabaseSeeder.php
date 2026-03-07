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

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@atlas.test'],
            [
                'name' => 'Admin User',
                'role' => User::ROLE_ADMIN,
                'password' => Hash::make('password'),
            ]
        );

        $instructorData = [
            ['name' => 'Avery Wright', 'email' => 'instructor@atlas.test'],
            ['name' => 'Jordan Lee', 'email' => 'jordan.lee@atlas.test'],
            ['name' => 'Harper Scott', 'email' => 'harper.scott@atlas.test'],
            ['name' => 'Quinn Patel', 'email' => 'quinn.patel@atlas.test'],
        ];

        $studentData = [
            ['name' => 'Student One', 'email' => 'student@atlas.test'],
            ['name' => 'Casey Morgan', 'email' => 'casey.morgan@atlas.test'],
            ['name' => 'Riley Kim', 'email' => 'riley.kim@atlas.test'],
            ['name' => 'Taylor Nguyen', 'email' => 'taylor.nguyen@atlas.test'],
            ['name' => 'Jamie Carter', 'email' => 'jamie.carter@atlas.test'],
            ['name' => 'Morgan Reyes', 'email' => 'morgan.reyes@atlas.test'],
        ];

        $instructors = collect($instructorData)->map(function (array $data) {
            return User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'role' => User::ROLE_INSTRUCTOR,
                    'password' => Hash::make('password'),
                ]
            );
        });

        $students = collect($studentData)->map(function (array $data) {
            return User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'role' => User::ROLE_STUDENT,
                    'password' => Hash::make('password'),
                ]
            );
        });

        $videoUrls = [
            'https://www.youtube.com/embed/ysz5S6PUM-U',
            'https://www.youtube.com/embed/jNQXAC9IVRw',
            'https://www.youtube.com/embed/k3oJf0kEEm0',
        ];

        $courseBlueprints = [
            [
                'title' => 'Product Design Foundations',
                'slug' => 'product-design-foundations',
                'level' => 'beginner',
                'description' => 'Build a design mindset, explore UX research methods, and craft interface foundations with real-world critique cycles.',
                'thumbnail_path' => '/images/courses/design-foundations.svg',
            ],
            [
                'title' => 'Full-Stack Engineering Sprint',
                'slug' => 'full-stack-engineering-sprint',
                'level' => 'intermediate',
                'description' => 'Ship a production-ready product slice with structured API design, testing strategy, and deployment playbooks.',
                'thumbnail_path' => '/images/courses/fullstack-sprint.svg',
            ],
            [
                'title' => 'Data Fluency for Teams',
                'slug' => 'data-fluency-for-teams',
                'level' => 'beginner',
                'description' => 'Interpret dashboards, build KPI narratives, and translate insights into business decisions with confidence.',
                'thumbnail_path' => '/images/courses/data-fluency.svg',
            ],
            [
                'title' => 'Leadership Operating System',
                'slug' => 'leadership-operating-system',
                'level' => 'advanced',
                'description' => 'Design high-trust rituals, scale team communication, and drive execution across distributed teams.',
                'thumbnail_path' => '/images/courses/leadership-os.svg',
            ],
            [
                'title' => 'AI Product Strategy Studio',
                'slug' => 'ai-product-strategy-studio',
                'level' => 'advanced',
                'description' => 'Evaluate AI opportunities, craft responsible product specs, and align stakeholders on measurable outcomes.',
                'thumbnail_path' => '/images/courses/ai-strategy.svg',
            ],
            [
                'title' => 'Marketing Growth Engine',
                'slug' => 'marketing-growth-engine',
                'level' => 'intermediate',
                'description' => 'Design acquisition loops, refine funnels, and build campaign scorecards with data-driven experiments.',
                'thumbnail_path' => '/images/courses/growth-engine.svg',
            ],
        ];

        $courseLessons = [];
        $courseAssignments = [];
        $courseQuizzes = [];

        foreach ($courseBlueprints as $index => $blueprint) {
            $course = Course::updateOrCreate(
                ['slug' => $blueprint['slug']],
                [
                    'title' => $blueprint['title'],
                    'description' => $blueprint['description'],
                    'level' => $blueprint['level'],
                    'status' => 'published',
                    'published_at' => now()->subDays(fake()->numberBetween(1, 45)),
                    'thumbnail_path' => $blueprint['thumbnail_path'],
                    'instructor_id' => $instructors[$index % $instructors->count()]->id,
                ]
            );

            $course->loadMissing('modules.lessons');
            $lessons = $course->modules->flatMap(function (Module $module) {
                return $module->lessons;
            });

            if ($lessons->isEmpty()) {
                $modulesCount = fake()->numberBetween(3, 4);
                for ($m = 1; $m <= $modulesCount; $m++) {
                    $module = Module::create([
                        'course_id' => $course->id,
                        'title' => "Module {$m}: ".fake()->words(2, true),
                        'description' => fake()->sentence(),
                        'sort_order' => $m,
                    ]);

                    $lessonCount = fake()->numberBetween(4, 5);
                    for ($l = 1; $l <= $lessonCount; $l++) {
                        $lessons->push(Lesson::create([
                            'module_id' => $module->id,
                            'title' => "Lesson {$l}: ".fake()->words(3, true),
                            'content' => fake()->paragraphs(3, true),
                            'video_url' => $videoUrls[$l % count($videoUrls)],
                            'duration_seconds' => fake()->numberBetween(300, 1800),
                            'sort_order' => $l,
                            'is_published' => true,
                        ]));
                    }
                }
            }

            $assignments = collect();
            if ($course->assignments()->count() === 0) {
                $assignmentsCount = fake()->numberBetween(3, 4);
                for ($a = 1; $a <= $assignmentsCount; $a++) {
                    $assignmentLesson = $lessons->isNotEmpty() ? $lessons->random() : null;
                    $assignments->push(Assignment::firstOrCreate([
                        'course_id' => $course->id,
                        'title' => "Assignment {$a}: ".fake()->words(3, true),
                    ], [
                        'lesson_id' => $assignmentLesson?->id,
                        'description' => fake()->paragraph(),
                        'due_at' => now()->addDays(fake()->numberBetween(3, 21)),
                        'max_points' => fake()->numberBetween(60, 100),
                        'is_published' => true,
                    ]));
                }
            } else {
                $assignments = $course->assignments;
            }

            $quizzes = collect();
            if ($course->quizzes()->count() === 0) {
                $quizCount = fake()->numberBetween(2, 3);
                for ($q = 1; $q <= $quizCount; $q++) {
                    $quizLesson = $lessons->isNotEmpty() ? $lessons->random() : null;
                    $quiz = Quiz::firstOrCreate([
                        'course_id' => $course->id,
                        'title' => "Quiz {$q}: ".fake()->words(3, true),
                    ], [
                        'lesson_id' => $quizLesson?->id,
                        'description' => fake()->sentence(),
                        'time_limit_minutes' => fake()->randomElement([20, 30, 45, null]),
                        'max_attempts' => fake()->randomElement([1, 2, 3]),
                        'is_published' => true,
                    ]);
                    $quizzes->push($quiz);

                    if ($quiz->questions()->count() === 0) {
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
                }
            } else {
                $quizzes = $course->quizzes;
            }

            if ($course->resources()->count() === 0) {
                Resource::create([
                    'course_id' => $course->id,
                    'lesson_id' => null,
                    'uploaded_by' => $course->instructor_id,
                    'title' => 'Course syllabus',
                    'type' => 'file',
                    'path' => 'resources/seed/course-syllabus.pdf',
                    'is_private' => true,
                ]);
                Resource::create([
                    'course_id' => $course->id,
                    'lesson_id' => null,
                    'uploaded_by' => $course->instructor_id,
                    'title' => 'Course cover image',
                    'type' => 'image',
                    'path' => 'resources/seed/course-cover.svg',
                    'is_private' => false,
                ]);

                $lessons->random(min(2, max(1, $lessons->count())))->each(function (Lesson $lesson) use ($course) {
                    Resource::create([
                        'course_id' => $course->id,
                        'lesson_id' => $lesson->id,
                        'uploaded_by' => $course->instructor_id,
                        'title' => 'Lesson worksheet',
                        'type' => 'worksheet',
                        'path' => 'resources/seed/lesson-worksheet.pdf',
                        'is_private' => true,
                    ]);
                });
            }

            $courseLessons[$course->id] = $lessons;
            $courseAssignments[$course->id] = $assignments;
            $courseQuizzes[$course->id] = $quizzes;
        }

        foreach ($students as $student) {
            $enrolledCourses = collect($courseLessons)->keys()->random(fake()->numberBetween(2, 3));
            foreach ($enrolledCourses as $courseId) {
                Enrollment::firstOrCreate([
                    'course_id' => $courseId,
                    'user_id' => $student->id,
                ], [
                    'status' => 'active',
                    'enrolled_at' => now()->subDays(fake()->numberBetween(1, 45)),
                ]);

                $lessons = $courseLessons[$courseId];
                $lessons->random(fake()->numberBetween(3, min(6, $lessons->count())))
                    ->each(function (Lesson $lesson) use ($student) {
                        $completed = fake()->boolean(55);
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
                        $exists = AssignmentSubmission::query()
                            ->where('assignment_id', $assignment->id)
                            ->where('user_id', $student->id)
                            ->exists();
                        if ($exists) {
                            return;
                        }

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
                        $exists = QuizAttempt::query()
                            ->where('quiz_id', $quiz->id)
                            ->where('user_id', $student->id)
                            ->exists();
                        if ($exists) {
                            return;
                        }

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
