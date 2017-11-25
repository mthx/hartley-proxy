import * as crypto from 'crypto';
import * as fs from 'fs';
import * as forge from 'node-forge';

// A simple certificate authority that maintains a root certificate
// that can be added as a CA in browser / OS certificate stores and
// can generate certificates signed by that root for other domains
// on demand.
//
// Certificates are stored on disk and restored at startup.

const KEY_LENGTH = 2048;

const ORGANISATION_NAME = 'Hartley Proxy CA'
const CA_SUBJECT = [
  {
    name: 'commonName',
    value: 'HartleyProxyCA',
  },
  {
    name: 'countryName',
    value: 'N/A',
  },
  {
    shortName: 'ST',
    value: 'N/A',
  },
  {
    name: 'localityName',
    value: 'N/A',
  },
  {
    name: 'organizationName',
    value: ORGANISATION_NAME,
  },
  {
    shortName: 'OU',
    value: 'N/A',
  },
];

// tslint:disable: object-literal-sort-keys - name first!
const CA_EXTENSIONS = [
  {
    name: 'basicConstraints',
    cA: true,
  },
  {
    name: 'keyUsage',
    keyCertSign: true,
    digitalSignature: true,
    nonRepudiation: true,
    keyEncipherment: true,
    dataEncipherment: true,
  },
  {
    name: 'extKeyUsage',
    serverAuth: true,
    clientAuth: true,
    codeSigning: true,
    emailProtection: true,
    timeStamping: true,
  },
  {
    name: 'nsCertType',
    client: true,
    server: true,
    email: true,
    objsign: true,
    sslCA: true,
    emailCA: true,
    objCA: true,
  },
  {
    name: 'subjectKeyIdentifier',
  },
];

const SERVER_SUBJECT = [
  {
    name: 'countryName',
    value: 'N/A',
  },
  {
    shortName: 'ST',
    value: 'N/A',
  },
  {
    name: 'localityName',
    value: 'N/A',
  },
  {
    name: 'organizationName',
    value: ORGANISATION_NAME,
  },
  {
    shortName: 'OU',
    value: ORGANISATION_NAME + ' Server Certificate',
  },
];

const SERVER_EXTENSIONS = [
  {
    name: 'basicConstraints',
    cA: false,
  },
  {
    name: 'keyUsage',
    keyCertSign: false,
    digitalSignature: true,
    nonRepudiation: false,
    keyEncipherment: true,
    dataEncipherment: true,
  },
  {
    name: 'extKeyUsage',
    serverAuth: true,
    clientAuth: true,
    codeSigning: false,
    emailProtection: false,
    timeStamping: false,
  },
  {
    name: 'nsCertType',
    client: true,
    server: true,
    email: false,
    objsign: false,
    sslCA: false,
    emailCA: false,
    objCA: false,
  },
  {
    name: 'subjectKeyIdentifier',
  },
];
// tslint:enable: object-literal-sort-keys!

async function generateKeyPair(): Promise<IKeyPair> {
  return new Promise<IKeyPair>((resolve, reject) => {
    forge.pki.rsa.generateKeyPair({ bits: KEY_LENGTH }, (err, keys) => {
      if (err) {
        reject(err);
      }
      resolve(keys);
    });
  });
}

function createCertificate(): any {
  // Missing typings.
  return (forge.pki as any).createCertificate();
}

async function createRootDetails(): Promise<IKeyDetails> {
  const keys = await generateKeyPair();
  const certificate = createCertificate();
  certificate.publicKey = keys.publicKey;
  certificate.serialNumber = randomSerialNumber();
  certificate.validity.notBefore = justBeforeNow();
  certificate.validity.notAfter = yearsFromNow(10);
  certificate.setIssuer(CA_SUBJECT);
  certificate.setSubject(CA_SUBJECT);
  certificate.setExtensions(CA_EXTENSIONS);
  certificate.sign(keys.privateKey, forge.md.sha256.create());
  return { certificate, keys };
}

function randomSerialNumber() {
  const buf = Buffer.alloc(18);
  crypto.randomFillSync(buf);
  const hex = buf.toString('hex');
  return '00' + hex;
}

function justBeforeNow(): Date {
  const date = new Date();
  date.setTime(date.getTime() - 1);
  return date;
}

function yearsFromNow(delta: number): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() + delta);
  return date;
}

export interface ICertificateAuthorityOptions {
  storeDirectory: string;
}

export interface IKeyPair {
  privateKey: any;
  publicKey: any;
}

export interface IKeyDetails {
  certificate: any;
  keys: IKeyPair;
}

export interface IHostCertificates {
  certificatePem: string;
  privateKeyPem: string;
}

export async function createCertificateAuthority(
  options: ICertificateAuthorityOptions
): Promise<CertificateAuthority> {
  const details = await createRootDetails();
  return new CertificateAuthority(options, details);
}

export class CertificateAuthority {
  constructor(
    private options: ICertificateAuthorityOptions,
    private details: IKeyDetails
  ) {}

  public async certificateForHosts(
    hosts: string[]
  ): Promise<IHostCertificates> {
    const keys = await generateKeyPair();
    const certificate = createCertificate();
    certificate.publicKey = keys.publicKey;
    certificate.serialNumber = randomSerialNumber();
    certificate.validity.notBefore = justBeforeNow();
    certificate.validity.notAfter = yearsFromNow(2);
    certificate.setSubject([
      {
        name: 'commonName',
        value: hosts[0],
      },
      ...SERVER_SUBJECT,
    ]);
    certificate.setIssuer(this.details.certificate.issuer.attributes);
    certificate.setExtensions([
      ...SERVER_EXTENSIONS,
      {
        name: 'subjectAltName',
        altNames: hosts.map(
          host =>
            // ipv6 ?
            host.match(/^[\d\.]+$/)
              ? { type: 7, ip: host }
              : { type: 2, value: host }
        ),
      },
    ]);
    certificate.sign(this.details.keys.privateKey, forge.md.sha256.create());

    const certificatePem = forge.pki.certificateToPem(certificate);
    const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
    return { certificatePem, privateKeyPem };
  }
}
