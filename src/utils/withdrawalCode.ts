import { randomInt } from "crypto";

export function generateWithdrawalCode(): string {
  const code = randomInt(0, 10000);
  return String(code).padStart(4, "0");
}
