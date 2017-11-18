import { IncomingHttpHeaders, IncomingMessage, OutgoingHttpHeaders, RequestOptions, ServerResponse } from 'http';
import * as http from 'http';
import * as https from 'https';
import * as net from 'net';
import * as url from 'url';

import { IHeaderMap, parseRawHeaders } from './headers';
import { effectiveRequestUrl } from './http-defined';
import { ServerLifecycle } from './server-lifecycle';

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

  // A HTTP server acting as a proxy (gateway) on a configured port.
  private httpServer: ServerLifecycle;

  // A HTTPs server that the HTTP server forwards CONNECT requests to,
  // after ensuring it has a SNI context for the relevant HOST.  This
  // allows us to MITM HTTPS.  The server itself acts as a reverse proxy
  // based on the SNI context.
  // Port is dynamically allocated is it isn't relevant externally.
  private httpsServer: ServerLifecycle;

  constructor(options: Partial<IProxyOptions>) {
    this.options = defaultOptions(options);
    this.httpServer = new ServerLifecycle(new http.Server(), this.options);
    this.httpServer.on('request', this.handleHttpProxyRequest.bind(this));
    this.httpServer.on('connect', this.handleHttpConnect.bind(this));

    this.httpsServer = new ServerLifecycle(new https.Server(), {port: 0, hostname: '127.0.0.1'});
    this.httpsServer.on('request', this.handleHttpsReverseProxyRequest.bind(this));
  }

  public listen(): Promise<any> {
    return Promise.all([this.httpServer.listen(), this.httpsServer.listen()]);
  }

  public close(): Promise<any> {
    return Promise.all([this.httpServer.close(), this.httpsServer.close()]);
  }

  public url(): url.Url | undefined {
    return this.httpServer.url();
  }

  private handleHttpConnect(request: IncomingMessage, incomingSocket: net.Socket, head: Buffer): void {
    // For now this makes a direct connection.  To actually intercept HTTPs traffic,
    // we need to proxy to our own https.Server that has an SNI context per host/port
    // with a certificate we generate when first encountering that host (with a CA cert we can import
    // in the browser).
    const {hostname, port} = url.parse('http://' + request.url!);
    const outgoingSocket = net.connect(parseInt(port!, 10), hostname, () => {
      incomingSocket.write(
        'HTTP/1.1 200 Connection Established\r\n' +
        '\r\n'
      );

      outgoingSocket.write(head);
      outgoingSocket.pipe(incomingSocket);
      incomingSocket.pipe(outgoingSocket);
    });
  }

  private handleHttpsReverseProxyRequest(incomingRequest: IncomingMessage, incomingResponse: ServerResponse): void {
    const incomingHeaders = this.validateIncomingHeaders(incomingRequest, incomingResponse);
    if (!incomingHeaders) {
      return;
    }

    const {host} = incomingHeaders;
    const {method} = incomingRequest;
    this.proxyRequest({
      headers: incomingHeaders,
      host: host[0],
      method,
    }, https, incomingRequest, incomingResponse);
  }

  private handleHttpProxyRequest(incomingRequest: IncomingMessage, incomingResponse: ServerResponse): void {
    const incomingHeaders = this.validateIncomingHeaders(incomingRequest, incomingResponse);
    if (!incomingHeaders) {
      return;
    }

    const outgoingUrl = effectiveRequestUrl('http:', incomingRequest.url as string, incomingHeaders.host[0]);
    this.proxyRequest({
      headers: {... incomingHeaders, host: outgoingUrl.host},
      method: incomingRequest.method!,
      ... outgoingUrl,
    }, http, incomingRequest, incomingResponse);
  }

  private proxyRequest(options: any, protocolModule: any, incomingRequest: IncomingMessage, incomingResponse: ServerResponse): void {
    const outgoingRequest = protocolModule.request(options, (outgoingResponse: IncomingMessage) => {
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

  private validateIncomingHeaders(incomingRequest: IncomingMessage, incomingResponse: ServerResponse) {
    const incomingHeaders = parseRawHeaders(incomingRequest.rawHeaders);
    if (incomingHeaders.host && incomingHeaders.host.length > 1) {
      this.reject(incomingResponse, 'Multiple host headers.');
      return undefined;
    }
    if (incomingHeaders['content-length'] && incomingHeaders['content-length'].length > 1) {
      this.reject(incomingResponse, 'Multiple content-length headers.');
      return undefined;
    }
    return incomingHeaders;
  }

  private reject(incomingResponse: ServerResponse, message: string): void {
    incomingResponse.writeHead(400, 'Bad request', {'content-type': 'text/plain'});
    incomingResponse.end(message);
  }

}
