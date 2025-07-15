-- CreateTable
CREATE TABLE "TickPrice" (
    "id" SERIAL NOT NULL,
    "tick" INTEGER NOT NULL,
    "commodityId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TickPrice_pkey" PRIMARY KEY ("id")
);
