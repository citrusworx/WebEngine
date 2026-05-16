export type Registrar = 'resellerclub' | 'godaddy' | 'namecheap' | 'cloudflare';

export type DnsHost = 'digitalocean' | 'aws' | 'azure' | 'gcp' | 'cloudflare' | 'linode' | 'vultr' | 'ovhcloud' | 'hetzner';

export type Provider = Registrar | DnsHost;

export type RegistrarAction = 'register' | 'transfer' | 'renew' | 'restore' | 'search';

export type DnsHostAction = 'getNameservers' | 'setNameservers' | 'updateRecords';

export type Action = RegistrarAction | DnsHostAction;
