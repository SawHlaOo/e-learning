-- AlterTable
ALTER TABLE "QuizQuestion" ALTER COLUMN "options" SET DEFAULT '[]',
ALTER COLUMN "correctAnswer" DROP NOT NULL;
