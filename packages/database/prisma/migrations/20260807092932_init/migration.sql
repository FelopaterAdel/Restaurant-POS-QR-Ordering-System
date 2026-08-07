/*
  Warnings:

  - You are about to drop the column `restaurantId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Restaurant` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_restaurantId_fkey";

-- DropIndex
DROP INDEX "User_restaurantId_email_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "restaurantId";

-- DropTable
DROP TABLE "Restaurant";

-- DropEnum
DROP TYPE "RestaurantStatus";

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
