export function money(amount: number | string, currency = "USD") {
  const value = Number(amount);
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number.isFinite(value) ? value : 0);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
