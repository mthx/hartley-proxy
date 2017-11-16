import { IncomingHttpHeaders, IncomingMessage, OutgoingHttpHeaders, RequestOptions, Server, ServerResponse } from 'http';
import * as http from 'http';
import * as https from 'https';
import { IHeaderMap, parseRawHeaders } from './headers';
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

  private outgoingRequestOptions(effectiveRequestUri: Url, method: string, incomingHeaders: IHeaderMap): RequestOptions {
    const {host, hostname, path, port, protocol} = effectiveRequestUri;
    const outgoingHeaders = {... incomingHeaders, host: host as string};
    return {
      headers: outgoingHeaders,
      hostname, method, path, port, protocol,
    };
  }

  private handleProxyRequest(incomingRequest: IncomingMessage, incomingResponse: ServerResponse): void {
    const incomingHeaders = parseRawHeaders(incomingRequest.rawHeaders);
    if (incomingHeaders.host && incomingHeaders.host.length > 1) {
      this.reject(incomingResponse, 'Multiple host headers.');
      return;
    }
    if (incomingHeaders['content-length'] && incomingHeaders['content-length'].length > 1) {
      this.reject(incomingResponse, 'Multiple content-length headers.');
      return;
    }

    const options = this.outgoingRequestOptions(
      effectiveRequestUrl('http:', incomingRequest.url as string, incomingHeaders.host[0]),
      incomingRequest.method as string,
      incomingHeaders
    );

    const module: any = ({'http:': http, 'https:': https} as any)[options.protocol as string];
    if (!module) {
      this.reject(incomingResponse, 'Unsupported protocol: ' + options.protocol);
      return;
    }

    const outgoingRequest = module.request(options, (outgoingResponse: IncomingMessage) => {
      const newHeaders = parseRawHeaders(outgoingResponse.rawHeaders);
      Object.keys(newHeaders).forEach(h => incomingResponse.setHeader(h, newHeaders[h]));
      outgoingResponse.pipe(incomingResponse);
    });
    incomingRequest.pipe(outgoingRequest);
    incomingRequest.on('abort', () => outgoingRequest.abort());
    incomingRequest.on('error', () => outgoingRequest.abort());
    outgoingRequest.on('error', (e: any) => {
      if (!incomingResponse.headersSent) {
        incomingResponse.writeHead(502);
      }
      incomingResponse.end();
    })
  }

  private reject(incomingResponse: ServerResponse, message: string): void {
    incomingResponse.writeHead(400, 'Bad request', {'content-type': 'text/plain'});
    incomingResponse.end(message);
  }

}
