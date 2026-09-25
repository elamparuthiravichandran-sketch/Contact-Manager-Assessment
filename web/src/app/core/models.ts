export interface ContactInput {
  firstName: string; lastName: string; email: string; phoneNumber: string;
  address: string; city: string; state: string; country: string; postalCode: string;
}
export interface Contact extends ContactInput { id: string; createdAtUtc: string; version: string; }
export interface Token { accessToken: string; expiresAtUtc: string; username: string; }
export const fields: { key: keyof ContactInput; label: string; max: number; type: string; autocomplete: string }[] = [
  { key: 'firstName', label: 'First name', max: 80, type: 'text', autocomplete: 'given-name' },
  { key: 'lastName', label: 'Last name', max: 80, type: 'text', autocomplete: 'family-name' },
  { key: 'email', label: 'Email', max: 254, type: 'email', autocomplete: 'email' },
  { key: 'phoneNumber', label: 'Phone number', max: 30, type: 'tel', autocomplete: 'tel' },
  { key: 'address', label: 'Address', max: 200, type: 'text', autocomplete: 'street-address' },
  { key: 'city', label: 'City', max: 80, type: 'text', autocomplete: 'address-level2' },
  { key: 'state', label: 'State', max: 80, type: 'text', autocomplete: 'address-level1' },
  { key: 'country', label: 'Country', max: 80, type: 'text', autocomplete: 'country-name' },
  { key: 'postalCode', label: 'Postal code', max: 20, type: 'text', autocomplete: 'postal-code' }
];
