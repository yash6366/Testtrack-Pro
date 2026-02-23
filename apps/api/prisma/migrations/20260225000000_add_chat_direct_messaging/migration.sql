-- CreateTable MessageMention
CREATE TABLE IF NOT EXISTS "MessageMention" (
  "id" SERIAL NOT NULL,
  "messageId" INTEGER NOT NULL,
  "mentionedUserId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MessageMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable MessageReaction
CREATE TABLE IF NOT EXISTS "MessageReaction" (
  "id" SERIAL NOT NULL,
  "messageId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "emoji" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable MessageReply
CREATE TABLE IF NOT EXISTS "MessageReply" (
  "id" SERIAL NOT NULL,
  "messageId" INTEGER NOT NULL,
  "replyToId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MessageReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable PinnedMessage
CREATE TABLE IF NOT EXISTS "PinnedMessage" (
  "id" SERIAL NOT NULL,
  "channelId" INTEGER NOT NULL,
  "messageId" INTEGER NOT NULL,
  "pinnedBy" INTEGER NOT NULL,
  "pinnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PinnedMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable DirectMessage
CREATE TABLE IF NOT EXISTS "DirectMessage" (
  "id" SERIAL NOT NULL,
  "senderId" INTEGER NOT NULL,
  "recipientId" INTEGER NOT NULL,
  "message" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "replyToId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable DirectMessageReaction
CREATE TABLE IF NOT EXISTS "DirectMessageReaction" (
  "id" SERIAL NOT NULL,
  "messageId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "emoji" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DirectMessageReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable DirectMessageReply
CREATE TABLE IF NOT EXISTS "DirectMessageReply" (
  "id" SERIAL NOT NULL,
  "messageId" INTEGER NOT NULL,
  "replyToId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DirectMessageReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable ChatAuditLog
CREATE TABLE IF NOT EXISTS "ChatAuditLog" (
  "id" SERIAL NOT NULL,
  "adminId" INTEGER NOT NULL,
  "adminName" TEXT NOT NULL,
  "actionType" TEXT NOT NULL,
  "targetId" INTEGER,
  "targetName" TEXT,
  "targetType" TEXT,
  "reason" TEXT,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatAuditLog_pkey" PRIMARY KEY ("id")
);

-- UpdateTable ChannelMessage
ALTER TABLE "ChannelMessage" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ChannelMessage" ADD COLUMN IF NOT EXISTS "reactionsSnapshot" JSONB;
ALTER TABLE "ChannelMessage" ADD COLUMN IF NOT EXISTS "isPinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ChannelMessage" ADD COLUMN IF NOT EXISTS "pinnedById" INTEGER;
ALTER TABLE "ChannelMessage" ADD COLUMN IF NOT EXISTS "pinnedAt" TIMESTAMP(3);
ALTER TABLE "ChannelMessage" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ChannelMessage" ADD COLUMN IF NOT EXISTS "deletedById" INTEGER;
ALTER TABLE "ChannelMessage" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "ChannelMessage" ADD COLUMN IF NOT EXISTS "replyToId" INTEGER;

-- UpdateTable BugComment
ALTER TABLE "BugComment" ADD COLUMN IF NOT EXISTS "parentCommentId" INTEGER;
ALTER TABLE "BugComment" ADD COLUMN IF NOT EXISTS "editedAt" TIMESTAMP(3);

-- CreateIndexes
CREATE UNIQUE INDEX IF NOT EXISTS "MessageMention_messageId_mentionedUserId_key" ON "MessageMention"("messageId","mentionedUserId");
CREATE INDEX IF NOT EXISTS "MessageMention_messageId_idx" ON "MessageMention"("messageId");
CREATE INDEX IF NOT EXISTS "MessageMention_mentionedUserId_idx" ON "MessageMention"("mentionedUserId");

CREATE UNIQUE INDEX IF NOT EXISTS "MessageReaction_messageId_userId_emoji_key" ON "MessageReaction"("messageId","userId","emoji");
CREATE INDEX IF NOT EXISTS "MessageReaction_messageId_idx" ON "MessageReaction"("messageId");
CREATE INDEX IF NOT EXISTS "MessageReaction_userId_idx" ON "MessageReaction"("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "MessageReply_messageId_key" ON "MessageReply"("messageId");
CREATE INDEX IF NOT EXISTS "MessageReply_messageId_idx" ON "MessageReply"("messageId");
CREATE INDEX IF NOT EXISTS "MessageReply_replyToId_idx" ON "MessageReply"("replyToId");

CREATE UNIQUE INDEX IF NOT EXISTS "PinnedMessage_messageId_key" ON "PinnedMessage"("messageId");
CREATE UNIQUE INDEX IF NOT EXISTS "PinnedMessage_channelId_messageId_key" ON "PinnedMessage"("channelId","messageId");
CREATE INDEX IF NOT EXISTS "PinnedMessage_channelId_idx" ON "PinnedMessage"("channelId");
CREATE INDEX IF NOT EXISTS "PinnedMessage_pinnedAt_idx" ON "PinnedMessage"("pinnedAt");

CREATE INDEX IF NOT EXISTS "DirectMessage_senderId_idx" ON "DirectMessage"("senderId");
CREATE INDEX IF NOT EXISTS "DirectMessage_recipientId_idx" ON "DirectMessage"("recipientId");
CREATE INDEX IF NOT EXISTS "DirectMessage_createdAt_idx" ON "DirectMessage"("createdAt");
CREATE INDEX IF NOT EXISTS "DirectMessage_isRead_idx" ON "DirectMessage"("isRead");

CREATE UNIQUE INDEX IF NOT EXISTS "DirectMessageReaction_messageId_userId_emoji_key" ON "DirectMessageReaction"("messageId","userId","emoji");
CREATE INDEX IF NOT EXISTS "DirectMessageReaction_messageId_idx" ON "DirectMessageReaction"("messageId");
CREATE INDEX IF NOT EXISTS "DirectMessageReaction_userId_idx" ON "DirectMessageReaction"("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "DirectMessageReply_messageId_key" ON "DirectMessageReply"("messageId");
CREATE INDEX IF NOT EXISTS "DirectMessageReply_messageId_idx" ON "DirectMessageReply"("messageId");
CREATE INDEX IF NOT EXISTS "DirectMessageReply_replyToId_idx" ON "DirectMessageReply"("replyToId");

CREATE INDEX IF NOT EXISTS "ChatAuditLog_adminId_idx" ON "ChatAuditLog"("adminId");
CREATE INDEX IF NOT EXISTS "ChatAuditLog_actionType_idx" ON "ChatAuditLog"("actionType");
CREATE INDEX IF NOT EXISTS "ChatAuditLog_timestamp_idx" ON "ChatAuditLog"("timestamp");
CREATE INDEX IF NOT EXISTS "ChatAuditLog_targetId_idx" ON "ChatAuditLog"("targetId");
CREATE INDEX IF NOT EXISTS "ChatAuditLog_targetType_idx" ON "ChatAuditLog"("targetType");

-- Indexes for BugComment parent relationship
CREATE INDEX IF NOT EXISTS "BugComment_parentCommentId_idx" ON "BugComment"("parentCommentId");

-- AddForeignKey
ALTER TABLE "MessageMention" ADD CONSTRAINT "MessageMention_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChannelMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageMention" ADD CONSTRAINT "MessageMention_mentionedUserId_fkey" FOREIGN KEY ("mentionedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChannelMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MessageReply" ADD CONSTRAINT "MessageReply_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChannelMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageReply" ADD CONSTRAINT "MessageReply_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "ChannelMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PinnedMessage" ADD CONSTRAINT "PinnedMessage_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PinnedMessage" ADD CONSTRAINT "PinnedMessage_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChannelMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PinnedMessage" ADD CONSTRAINT "PinnedMessage_pinnedBy_fkey" FOREIGN KEY ("pinnedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "DirectMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DirectMessageReaction" ADD CONSTRAINT "DirectMessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "DirectMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DirectMessageReaction" ADD CONSTRAINT "DirectMessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DirectMessageReply" ADD CONSTRAINT "DirectMessageReply_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "DirectMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DirectMessageReply" ADD CONSTRAINT "DirectMessageReply_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "DirectMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatAuditLog" ADD CONSTRAINT "ChatAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey for ChannelMessage updates
ALTER TABLE "ChannelMessage" ADD CONSTRAINT "ChannelMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChannelMessage" ADD CONSTRAINT "ChannelMessage_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChannelMessage" ADD CONSTRAINT "ChannelMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "ChannelMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey for BugComment parent relationship
ALTER TABLE "BugComment" ADD CONSTRAINT "BugComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "BugComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
