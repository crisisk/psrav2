// Prisma schema definition (for reference)
// This should be added to your schema.prisma file

model ResourceDownload {
  id          Int      @id @default(autoincrement())
  resourceId  Int
  userId      Int?     @db.Int
  downloadedAt DateTime @default(now())
  userAgent   String?

  // Relation to user table (if applicable)
  // @@index([userId])
  // User       User?    @relation(fields: [userId], references: [id])
}
