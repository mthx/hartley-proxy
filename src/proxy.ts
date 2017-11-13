import { IncomingHttpHeaders, IncomingMessage, OutgoingHttpHeaders, RequestOptions, Server, ServerResponse } from 'http';
import * as http from 'http';
import { effectiveRequestUrl } from './http-defined';

import { parse as parseUrl, resolve as resolveUrl, Url } from 'url';

export interface IProxyOptions {
  port: number;
  hostname: string;
}

function defaultOptions(options: Partial<IProxyOptions>): IProxyOptions {
  return {
    hostname: options.hostname || 'localhost',
    port: options.port || 0,
  };
}

interface IStringHeaders {
  [header: string]: string | string[];
}

export class Proxy {

  private options: IProxyOptions;
  private server: Server;

  constructor(options: Partial<IProxyOptions>) {
    this.options = defaultOptions(options);
    this.server = new Server();
    this.server.on('request', this.handleProxyRequest.bind(this));
  }

  public listen(): Promise<void> {
    return new Promise((resolve, reject) => {
      const { port, hostname } = this.options;
      this.server.listen({ port, hostname }, undefined, resolve);
    });
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close(resolve);
    });
  }

  public url(): string {
    return 'http://' + this.hostAndPort();
  }

  public hostname(): string {
    return this.options.hostname;
  }

  public port(): number | undefined {
    const address = this.server.address();
    return address ? address.port : undefined;
  }

  private hostAndPort(): string {
    return this.hostname() + ':' + this.port();
  }

  private outgoingRequestOptions(effectiveRequestUri: Url, incomingRequest: IncomingMessage): RequestOptions {
    const {host, hostname, path, port, protocol} = effectiveRequestUri;
    const {method, headers: incomingHeaders} = incomingRequest;
    return {
      headers: this.incomingHeadersToOutgoingHeaders(incomingHeaders, host as string),
      hostname, method, path, port, protocol,
    };
  }

  private handleProxyRequest(incomingRequest: IncomingMessage, incomingResponse: ServerResponse): void {
    const effectiveRequestUri = this.effectiveRequestUri(incomingRequest);
    const options = this.outgoingRequestOptions(effectiveRequestUri, incomingRequest);

    const outgoingRequest = http.request(options, (outgoingResponse: IncomingMessage) => {
      const newHeaders = this.outgoingResponseHeadersToIncomingResponseHeaders(outgoingResponse.headers);
      Object.keys(newHeaders).forEach(h => incomingResponse.setHeader(h, newHeaders[h]));
      outgoingResponse.pipe(incomingResponse);
    });
    incomingRequest.pipe(outgoingRequest);
    incomingRequest.on('abort', () => outgoingRequest.abort());
    incomingRequest.on('error', () => outgoingRequest.abort());
    outgoingRequest.on('error', e => {
      if (!incomingResponse.headersSent) {
        incomingResponse.writeHead(502);
      }
      incomingResponse.end();
    })
  }

  private incomingHeadersToOutgoingHeaders(headers: IncomingHttpHeaders, newHostHeader: string): IStringHeaders {
    // We at least need to strip hop-by-hop headers.
    return {... headers, host: newHostHeader};
  }

  private outgoingResponseHeadersToIncomingResponseHeaders(headers: IncomingHttpHeaders): IStringHeaders {
    // We at least need to strip hop-by-hop headers.
    return {... headers};
  }

  private effectiveRequestUri(incomingRequest: IncomingMessage): Url {
    // https://tools.ietf.org/html/draft-ietf-httpbis-p1-messaging-14#section-4.2
    // TODO: parse failures
    const requestUrl = incomingRequest.url as string;
    const hostHeader = incomingRequest.headers.host as string;
    return effectiveRequestUrl('http:', requestUrl, hostHeader);
  }

}
