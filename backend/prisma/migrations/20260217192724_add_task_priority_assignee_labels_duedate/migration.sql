-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "assigneeId" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "labels" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'medium';
