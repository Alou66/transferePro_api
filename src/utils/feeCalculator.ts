export function calculateTransferFee(amount: number): number {
  if (amount <= 0) {
    return 0;
  }

  const tranches = Math.ceil(amount / 5000);

  return tranches * 250;
}
