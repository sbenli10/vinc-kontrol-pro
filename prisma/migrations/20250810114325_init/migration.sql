-- CreateTable
CREATE TABLE "public"."Submission" (
    "id" TEXT NOT NULL,
    "equipment" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "location" TEXT,
    "time" TIMESTAMP(3) NOT NULL,
    "score" INTEGER NOT NULL,
    "negatives" JSONB NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);
