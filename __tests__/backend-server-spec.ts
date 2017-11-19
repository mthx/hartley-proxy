import * as fs from 'fs';
import * as http from 'http';

import { BackendServer } from '../src/backend-server';
import { BufferReadable } from '../src/buffer-streams';
import { httpRequest, IResponseWithBody } from '../src/http-request';

import { parse as parseUrl } from 'url';

describe.only('BackendServer', () => {
  const backend = new BackendServer();

  beforeEach(async () => await backend.listen());

  afterEach(async () => await backend.close());

  it('says hello', async () => {
    const response = await httpRequest(backend.url());
    expect(response.body.toString()).toEqual('Hello');
  });

  it('appends request body to greeting', async () => {
    const input = new BufferReadable(Buffer.from('there!'));
    const options = { ...backend.url(), method: 'POST' };
    const response = await httpRequest(options, input);
    expect(response.body.toString()).toEqual('Hello there!');
  });
});
