import { prisma } from "../config/database";

export async function generateUniqueReference(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const seq = String(now.getTime()).slice(-4);
  const reference = `TRF-${year}-${seq}`;

  const existing = await prisma.transfer.findUnique({
    where: { reference },
    select: { id: true },
  });

  if (existing) {
    return generateUniqueReference();
  }

  return reference;
}
