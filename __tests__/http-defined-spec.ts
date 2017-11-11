import * as http from 'http';
import {parse as parseUrl} from 'url';

import { effectiveRequestUrl } from '../src/http-defined';

describe('effectiveRequestUrl', () => {
  it('missing colon is error', () => {
    expect(() => effectiveRequestUrl('http', '/foo', 'example.com').href).toThrowError();
  });
  it('copes with relative request url, using host header', () => {
    expect(effectiveRequestUrl('http:', '/foo', 'example.com').href).toEqual('http://example.com/foo');
    expect(effectiveRequestUrl('http:', '/foo', 'example.com:8080').href).toEqual('http://example.com:8080/foo');
  });
  it('uses absolute request url in preference to host header and protocol', () => {
    expect(effectiveRequestUrl('http:', 'https://localhost/foo', 'example.com').href).toEqual('https://localhost/foo');
    expect(effectiveRequestUrl('http:', 'https://localhost:8080/foo', 'example.com').href).toEqual('https://localhost:8080/foo');
  });
  it('copes with *', () => {
    // Wrong?  The URL parser is mapping '' -> '/' in the path.
    expect(effectiveRequestUrl('http:', '*', 'example.com').href).toEqual('http://example.com/');
  });
});
