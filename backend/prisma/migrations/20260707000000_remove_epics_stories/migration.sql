-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_storyId_fkey";

-- DropForeignKey
ALTER TABLE "Story" DROP CONSTRAINT "Story_epicId_fkey";

-- DropForeignKey
ALTER TABLE "Epic" DROP CONSTRAINT "Epic_projectId_fkey";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "storyId",
ADD COLUMN     "projectId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Epic";

-- DropTable
DROP TABLE "Story";

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
