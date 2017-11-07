import * as http from 'http';

import { BackendServer } from '../src/backend-server';
import { Proxy } from '../src/proxy';

describe('proxy', () => {

  const backend = new BackendServer();
  const proxy = new Proxy({});

  beforeEach(async () => await Promise.all([proxy.listen(), backend.listen()]))
  afterEach(async () => await Promise.all([proxy.close(), backend.close()]));

  it('proxies a simple request specified via the path', async () => {
    const {response, body} = await proxyRequest(proxy, {path: backend.url()});
    expect(response.statusCode).toEqual(200);
    expect(body).toEqual('Hello, World!');
  });

  it('proxies a simple request specified with relative path and host header', async () => {
    const {response, body} = await proxyRequest(proxy, {headers: {host: backend.hostAndPort()}, path: '/'});
    expect(response.statusCode).toEqual(200);
    expect(body).toEqual('Hello, World!');
  });

});

interface IRequestResult {
  response: http.IncomingMessage;
  body: string;
}

async function proxyRequest(proxy: Proxy, options: http.RequestOptions): Promise<IRequestResult> {
  return new Promise<IRequestResult>((resolve, reject) => {
    const proxyOptions: http.RequestOptions = {
      ... options,
      hostname: proxy.hostname(),
      port: proxy.port(),
    };
    let body = '';
    const request = http.request(proxyOptions, (response: http.IncomingMessage) => {
      response.on('data', chunk => body += chunk.toString());
      response.on('end', () => resolve({response, body}));
    });
    request.on('error', e => reject(e));
    request.end();
  });
}
