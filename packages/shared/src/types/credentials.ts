export const CREDENTIAL_KEYS = [
  'ALPACA_API_KEY',
  'ALPACA_API_SECRET',
  'TWITCH_CLIENT_ID',
  'TWITCH_CLIENT_SECRET',
] as const;

export type CredentialKey = typeof CREDENTIAL_KEYS[number];

export interface CredentialDef {
  key: CredentialKey;
  label: string;
  service: string;
  hint?: string;
}

export const CREDENTIAL_DEFS: CredentialDef[] = [
  { key: 'ALPACA_API_KEY',       label: 'API Key',       service: 'Stocks (Alpaca)' },
  { key: 'ALPACA_API_SECRET',    label: 'API Secret',    service: 'Stocks (Alpaca)' },
  { key: 'TWITCH_CLIENT_ID',     label: 'Client ID',     service: 'Twitch' },
  { key: 'TWITCH_CLIENT_SECRET', label: 'Client Secret', service: 'Twitch' },
];
