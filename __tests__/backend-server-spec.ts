import * as http from 'http';

import { BackendServer } from '../src/backend-server';
import { httpRequest, IResponseWithBody } from '../src/http-request';

describe('BackendServer', () => {

  const backend = new BackendServer();

  beforeEach(async () => await backend.listen())

  it('says hello', async () => {
    const response = await httpRequest(backend.url());
    expect(response.body.toString()).toEqual('Hello, World!');
  });

});
