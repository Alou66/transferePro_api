// Dupliquée côté front (transferePro_web/src/features/transfers/utils/calculateTransferFee.ts) :
// aucun mécanisme de code partagé entre les deux projets, garder les deux formules synchronisées.
export function calculateTransferFee(amount: number): number {
  if (amount <= 0) {
    return 0;
  }

  const tranches = Math.ceil(amount / 5000);
  return tranches * 250;
}
 