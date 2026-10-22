import { useState } from 'react';
import { View } from 'react-native';
import type { Address } from '../lib/api';
import { Field } from './ui';

export function useAddress(name = '', state = '') {
  const [a, setA] = useState<Address>({ name, line1: '', line2: '', city: '', state, zip: '' });
  const set = (k: keyof Address) => (v: string) => setA((x) => ({ ...x, [k]: k === 'state' ? v.toUpperCase().slice(0, 2) : v }));
  const complete = !!(a.name.trim() && a.line1.trim() && a.city.trim() && /^[A-Z]{2}$/.test(a.state) && /^\d{5}(-\d{4})?$/.test(a.zip));
  return { address: a, set, complete };
}

export function AddressForm({ address: a, set }: ReturnType<typeof useAddress>) {
  return (
    <View style={{ gap: 12 }}>
      <Field label="Full name" value={a.name} onChangeText={set('name')} autoComplete="name" textContentType="name" />
      <Field label="Street address" value={a.line1} onChangeText={set('line1')} autoComplete="address-line1" textContentType="streetAddressLine1" />
      <Field label="Apartment, suite (optional)" value={a.line2} onChangeText={set('line2')} autoComplete="address-line2" textContentType="streetAddressLine2" />
      <Field label="City" value={a.city} onChangeText={set('city')} autoComplete="postal-address-locality" textContentType="addressCity" />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}><Field label="State" value={a.state} onChangeText={set('state')} autoCapitalize="characters" maxLength={2} textContentType="addressState" /></View>
        <View style={{ flex: 1.4 }}><Field label="ZIP" value={a.zip} onChangeText={set('zip')} keyboardType="number-pad" maxLength={10} autoComplete="postal-code" textContentType="postalCode" /></View>
      </View>
    </View>
  );
}
