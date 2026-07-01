export function getTimezoneParam(): string {
  const match = new Date().toString().match(/([-+][0-9]+)\s/);
  if (!match) {
    return "+00";
  }
  return match[1].replace("+", "%2B");
}
