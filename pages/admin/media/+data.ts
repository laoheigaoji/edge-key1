import type { PrismaClient } from "../../../generated/prisma/client";
import { getS3Config } from "../../../modules/media/service";
import { listMediaRecords } from "../../../modules/media/repository";

export type Data = ReturnType<typeof data>;

export async function data(pageContext: { prisma: PrismaClient }) {
  const [s3Config, mediaList] = await Promise.all([
    getS3Config(pageContext.prisma),
    listMediaRecords(pageContext.prisma, { page: 1, pageSize: 24 }),
  ]);

  return {
    s3Config,
    mediaList,
  };
}
