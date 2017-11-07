import * as http from 'http';

import { BackendServer } from '../src/backend-server';
import { Proxy } from '../src/proxy';

describe('proxy', () => {
  it('proxies a simple request', async () => {
    const backend = new BackendServer();
    const proxy = new Proxy({});

    await Promise.all([proxy.listen(), backend.listen()]);

    const {response, body} = await proxyRequest(proxy, backend);
    expect(response.statusCode).toEqual(200);
    expect(body).toEqual('Hello, World!');

    await Promise.all([proxy.close(), backend.close()]);
  });
});

interface IRequestResult {
  response: http.IncomingMessage;
  body: string;
}

async function proxyRequest(proxy: Proxy, backend: BackendServer): Promise<IRequestResult> {
  return new Promise<IRequestResult>((resolve, reject) => {
    const options: http.RequestOptions = {
      headers: {
        host: backend.hostAndPort(),
      },
      hostname: 'localhost',
      path: backend.url(),
      port: proxy.port(),
    };
    let body = '';
    const request = http.request(options, (response: http.IncomingMessage) => {
      response.on('data', chunk => body += chunk.toString());
      response.on('end', () => resolve({response, body}));
    });
    request.on('error', e => reject(e));
    request.end();
  });
}
