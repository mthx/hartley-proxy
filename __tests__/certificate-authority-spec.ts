import { createCertificateAuthority } from '../src/certificate-authority';

// These tests are slow.
jest.setTimeout(20000);

describe('CertificateAuthority', () => {
  it('initializes', async () => {
    const ca = await createCertificateAuthority({ storeDirectory: '/tmp/' });
    const certs = await ca.certificateForHosts(['localhost']);
  });
});
