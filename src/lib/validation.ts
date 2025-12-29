export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  // Lithuanian phone format: +370 or 8, followed by 8 digits
  const phoneRegex = /^(\+370|8)[0-9]{8}$/;
  const cleaned = phone.replace(/\s/g, "");
  return phoneRegex.test(cleaned);
}

export function validatePostalCode(postalCode: string): boolean {
  // Lithuanian postal code: 5 digits
  const postalCodeRegex = /^[0-9]{5}$/;
  return postalCodeRegex.test(postalCode);
}

export function validateRequired(value: string): boolean {
  return value.trim().length > 0;
}



