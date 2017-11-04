import * as fetch from 'node-fetch';
import { Proxy } from '../src/proxy';

describe('proxy', () => {
  it('starts and stops', async () => {
    const proxy = new Proxy({});
    await proxy.listen();
    await fetch(proxy.url())
    await proxy.close();
  });
});
