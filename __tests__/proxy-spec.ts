import * as http from 'http';
import * as stream from 'stream';

import { BackendServer } from '../src/backend-server';
import { BufferReadable } from '../src/buffer-streams';
import { httpRequest, IResponseWithBody } from '../src/http-request';
import { Proxy } from '../src/proxy';

describe('proxy', () => {

  const backend = new BackendServer();
  const proxy = new Proxy({});

  beforeEach(async () => await Promise.all([proxy.listen(), backend.listen()]))
  afterEach(async () => await Promise.all([proxy.close(), backend.close()]));

  it('proxies a simple request specified via the path', async () => {
    const {response, body} = await proxyRequest(proxy, {path: backend.url().href});
    expect(body.toString()).toEqual('Hello');
    expect(response.statusCode).toEqual(200);
  });

  it('proxies a simple request specified with relative path and host header', async () => {
    const {response, body} = await proxyRequest(proxy, {headers: {host: backend.url().host}, path: '/'});
    expect(body.toString()).toEqual('Hello');
    expect(response.statusCode).toEqual(200);
  });

  it('proxies a request with a body', async () => {
    const requestBody = new BufferReadable(Buffer.from('via the proxy'));
    const {response, body} = await proxyRequest(proxy, {method: 'PUT', headers: {host: backend.url().host}, path: '/'}, requestBody);
    expect(body.toString()).toEqual('Hello via the proxy');
    expect(response.statusCode).toEqual(200);
  });

});

/**
 * HTTP request but with the hostname/port configured as per the proxy.
 */
function proxyRequest(proxy: Proxy, options: http.RequestOptions, body?: stream.Readable): Promise<IResponseWithBody> {
  const {hostname, port} = proxy.url();
  const proxyOptions: http.RequestOptions = {
    ... options, hostname, port,
  };
  return httpRequest(proxyOptions, body);
}
