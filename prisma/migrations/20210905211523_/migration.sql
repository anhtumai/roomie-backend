/*
  Warnings:

  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Account";

-- CreateTable
CREATE TABLE "account" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(30) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "password" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apartment" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(30) NOT NULL,
    "adminId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "apartmentId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account.username_unique" ON "account"("username");

-- CreateIndex
CREATE UNIQUE INDEX "apartment.name_unique" ON "apartment"("name");

-- CreateIndex
CREATE UNIQUE INDEX "apartment_adminId_unique" ON "apartment"("adminId");

-- AddForeignKey
ALTER TABLE "apartment" ADD FOREIGN KEY ("adminId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD FOREIGN KEY ("apartmentId") REFERENCES "apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
