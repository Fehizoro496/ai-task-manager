-- AlterTable
ALTER TABLE "_ConversationMembers" ADD CONSTRAINT "_ConversationMembers_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ConversationMembers_AB_unique";
