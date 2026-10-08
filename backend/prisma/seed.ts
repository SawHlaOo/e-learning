import "dotenv/config";
import bcrypt from "bcryptjs";
import { Difficulty, PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The development seed is disabled in production.");
  }

  const seedPassword = (name: string) => {
    const password = process.env[name];
    if (!password || password.length < 12) {
      throw new Error(`${name} must be set to a unique password with at least 12 characters before seeding.`);
    }
    return password;
  };
  const adminPassword = seedPassword("SEED_ADMIN_PASSWORD");
  const instructorPassword = seedPassword("SEED_INSTRUCTOR_PASSWORD");
  const studentPassword = seedPassword("SEED_STUDENT_PASSWORD");
  const [adminHash, instructorHash, studentHash] = await Promise.all([
    bcrypt.hash(adminPassword, 12),
    bcrypt.hash(instructorPassword, 12),
    bcrypt.hash(studentPassword, 12),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { role: Role.ADMIN, isActive: true },
    create: { name: "PyPath Admin", email: "admin@example.com", passwordHash: adminHash, role: Role.ADMIN },
  });
  await prisma.user.upsert({
    where: { email: "instructor@example.com" },
    update: { role: Role.INSTRUCTOR, isActive: true },
    create: { name: "PyPath Instructor", email: "instructor@example.com", passwordHash: instructorHash, role: Role.INSTRUCTOR },
  });
  await prisma.user.upsert({
    where: { email: "student@example.com" },
    update: { role: Role.STUDENT, isActive: true },
    create: { name: "PyPath Student", email: "student@example.com", passwordHash: studentHash, role: Role.STUDENT },
  });

  const slug = "python-for-everyone";
  const existingCourse = await prisma.course.findUnique({ where: { slug } });
  const instructor = await prisma.user.findUniqueOrThrow({ where: { email: "instructor@example.com" } });
  const course = existingCourse
    ? await prisma.course.update({
      where: { id: existingCourse.id },
      data: { published: true, featured: true },
    })
    : await prisma.course.create({
      data: {
        title: "Python for Everyone",
        slug,
        summary: "Build a confident foundation in Python, one practical lesson at a time.",
        description: "A beginner-friendly introduction to Python programming, from your first print statement to object-oriented design and working with files.",
        level: Difficulty.EASY,
        published: true,
        featured: true,
        estimatedHours: 12,
        authorId: instructor.id,
      },
    });

  const existingModuleCount = existingCourse
    ? await prisma.module.count({ where: { courseId: course.id } })
    : 0;
  if (existingModuleCount > 0) {
    console.log("Seed users updated; the existing course is now published.");
    return;
  }

  const moduleTitles = [
    "Getting started with Python",
    "Variables and data types",
    "Making decisions",
    "Loops and collections",
    "Functions and reusable code",
    "Files and object-oriented Python",
  ];
  const lessonTitles = [
    ["What is Python?", "Setting up your environment", "Your first Python program", "Reading error messages", "Using the Python REPL"],
    ["Variables and assignment", "Numbers and arithmetic", "Strings and formatting", "Booleans and None", "Converting between types"],
    ["Comparison operators", "Writing if statements", "Combining conditions", "Branching with elif", "Truthy and falsy values"],
    ["Repeating work with for", "While loops", "Working with lists", "Tuples and sets", "Dictionaries in practice"],
    ["Defining a function", "Parameters and arguments", "Returning values", "Scope and naming", "Organizing a small program"],
    ["Reading and writing files", "Working with JSON", "Handling exceptions", "Classes and objects", "Your next steps with Python"],
  ];
  for (let moduleIndex = 0; moduleIndex < moduleTitles.length; moduleIndex += 1) {
    const module = await prisma.module.create({
      data: {
        title: moduleTitles[moduleIndex],
        description: `A practical module covering ${moduleTitles[moduleIndex].toLowerCase()}.`,
        order: moduleIndex + 1,
        courseId: course.id,
      },
    });
    await prisma.lesson.createMany({
      data: lessonTitles[moduleIndex].map((title, lessonIndex) => ({
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        content: `${title} is part of ${module.title}. Work through the examples, then try the practice exercise before moving on.`,
        order: lessonIndex + 1,
        durationMinutes: 8 + (lessonIndex % 4) * 2,
        published: true,
        moduleId: module.id,
      })),
    });
  }

  const exercises = [
    ["Say hello", "Print a friendly greeting for a name.", Difficulty.EASY],
    ["Convert temperatures", "Convert Celsius to Fahrenheit.", Difficulty.EASY],
    ["Even or odd", "Determine whether an integer is even or odd.", Difficulty.EASY],
    ["Find the maximum", "Find the largest value in a list.", Difficulty.EASY],
    ["Count vowels", "Count vowels in a string.", Difficulty.MEDIUM],
    ["FizzBuzz", "Practice branching and loops.", Difficulty.MEDIUM],
    ["Word frequency", "Count the words in a short sentence.", Difficulty.MEDIUM],
    ["Validate a password", "Check a password against simple rules.", Difficulty.MEDIUM],
    ["Read a JSON file", "Load and summarize a JSON document.", Difficulty.HARD],
    ["Build a small class", "Model a book using a Python class.", Difficulty.HARD],
  ] as const;
  const seededLessons = await prisma.lesson.findMany({
    where: { module: { courseId: course.id } },
    select: { id: true },
    orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
  });
  await prisma.exercise.createMany({
    data: exercises.map(([title, description, difficulty], index) => ({
      title,
      description,
      difficulty,
      instructions: "Write your solution and compare it with the learning notes.",
      starterCode: "# Write your solution here\n",
      points: difficulty === Difficulty.EASY ? 10 : difficulty === Difficulty.MEDIUM ? 20 : 30,
      published: true,
      lessonId: seededLessons[index]?.id,
    })),
  });

  const projects = [
    ["Tip calculator", Difficulty.EASY],
    ["Number guessing game", Difficulty.EASY],
    ["Personal expense tracker", Difficulty.MEDIUM],
    ["File organizer", Difficulty.MEDIUM],
  ] as const;
  await prisma.project.createMany({
    data: projects.map(([title, difficulty]) => ({
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: `Build a ${title.toLowerCase()} while practicing Python fundamentals.`,
      difficulty,
      requirements: ["Plan the steps", "Implement the core behavior", "Test with sample input"],
      skills: difficulty === Difficulty.EASY ? ["variables", "conditions", "input/output"] : ["functions", "collections", "files"],
      instructions: "Break the project into small functions and test each part as you go.",
      published: true,
      courseId: course.id,
    })),
  });

  const categories = ["Python Basics", "Variables", "Data Types", "Operators", "Conditions", "Loops", "Lists", "Dictionaries", "Functions", "Files and JSON"];
  await prisma.cheatSheet.createMany({
    data: categories.map((category) => ({
      title: `${category} quick reference`,
      slug: category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      category,
      content: `A concise ${category.toLowerCase()} reference will be added here as the course develops.`,
      published: true,
    })),
  });

  const videos = [
    ["Python in a nutshell", "dQw4w9WgXcQ"],
    ["Variables and values", "M7lc1UVf-VE"],
    ["Loops and repetition", "ysz5S6PUM-U"],
    ["Functions explained", "ScMzIvxBSi4"],
    ["Build your first project", "jNQXAC9IVRw"],
  ];
  await prisma.youTubeVideo.createMany({
    data: videos.map(([title, youtubeVideoId], index) => ({
      title,
      youtubeVideoId,
      youtubeUrl: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
      description: `Video ${index + 1} from the PyPath learning library.`,
      authorId: admin.id,
      published: false,
    })),
  });

  await prisma.achievement.createMany({
    data: [
      ["Python Beginner", "Complete your first Python learning milestone.", "🐍", 10],
      ["First Program", "Complete your first lesson.", "💻", 10],
      ["10 Challenges", "Complete ten practice challenges.", "🧠", 50],
      ["7 Day Streak", "Learn for seven days in a row.", "🔥", 70],
      ["First Project", "Finish your first project.", "🚀", 100],
      ["Course Completed", "Complete a full course.", "🏆", 100],
    ].map(([name, description, icon, points]) => ({
      name: String(name),
      description: String(description),
      icon: String(icon),
      points: Number(points),
    })),
    skipDuplicates: true,
  });

  console.log("Created development seed users and beginner course content.");
}

main()
  .catch((error: unknown) => {
    console.error("Prisma seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
