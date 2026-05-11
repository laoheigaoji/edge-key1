-- CreateTable: S3 configuration for media storage
CREATE TABLE "S3Config" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "endpoint" TEXT NOT NULL,
    "accessKeyId" TEXT NOT NULL,
    "secretAccessKey" TEXT NOT NULL,
    "bucketName" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'auto',
    "publicDomain" TEXT,
    "pathPrefix" TEXT,
    "cacheControl" TEXT NOT NULL DEFAULT 'public, max-age=31536000, immutable',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable: Media files uploaded to S3
CREATE TABLE "Media" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "path" TEXT,
    "metadata" TEXT,
    "uploadedBy" INTEGER NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Media_storedName_key" ON "Media"("storedName");

-- CreateIndex
CREATE UNIQUE INDEX "Media_fileKey_key" ON "Media"("fileKey");

-- CreateIndex
CREATE INDEX "Media_mimeType_idx" ON "Media"("mimeType");

-- CreateIndex
CREATE INDEX "Media_uploadedAt_idx" ON "Media"("uploadedAt");

-- CreateIndex
CREATE INDEX "Media_path_idx" ON "Media"("path");
