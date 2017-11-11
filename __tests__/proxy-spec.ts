import * as http from 'http';

import { BackendServer } from '../src/backend-server';
import { httpRequest, IResponseWithBody } from '../src/http-request';
import { Proxy } from '../src/proxy';

describe('proxy', () => {

  const backend = new BackendServer();
  const proxy = new Proxy({});

  beforeEach(async () => await Promise.all([proxy.listen(), backend.listen()]))
  afterEach(async () => await Promise.all([proxy.close(), backend.close()]));

  it('proxies a simple request specified via the path', async () => {
    const {response, body} = await proxyRequest(proxy, {path: backend.url()});
    expect(response.statusCode).toEqual(200);
    expect(body.toString()).toEqual('Hello, World!');
  });

  it('proxies a simple request specified with relative path and host header', async () => {
    const {response, body} = await proxyRequest(proxy, {headers: {host: backend.hostAndPort()}, path: '/'});
    expect(response.statusCode).toEqual(200);
    expect(body.toString()).toEqual('Hello, World!');
  });

});

/**
 * HTTP request but with the hostname/port configured as per the proxy.
 */
function proxyRequest(proxy: Proxy, options: http.RequestOptions): Promise<IResponseWithBody> {
  const proxyOptions: http.RequestOptions = {
    ... options,
    hostname: proxy.hostname(),
    port: proxy.port(),
  };
  return httpRequest(proxyOptions);
}
