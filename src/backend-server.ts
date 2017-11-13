import * as http from 'http';
import { IncomingHttpHeaders, IncomingMessage, OutgoingHttpHeaders, RequestOptions, Server, ServerResponse } from 'http';
import { BufferWritable } from './buffer-streams';

/**
 * A stub server used for testing the proxy.
 */
export class BackendServer {

  private server: Server;

  constructor() {
    this.server = new Server((request: IncomingMessage, response: ServerResponse) => {
      const bufferWritable = new BufferWritable();
      response.writeHead(200, undefined, {'Content-Type': 'text/plain'});
      request.pipe(bufferWritable);
      bufferWritable.on('finish', () => {
        response.end(('Hello ' + bufferWritable.toBuffer().toString()).trim());
      });
    });
}

  public listen(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen({ port: 0, hostname: 'localhost' }, undefined, resolve);
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
    return 'localhost';
  }

  public port(): number | undefined {
    const address = this.server.address();
    return address ? address.port : undefined;
  }

  public hostAndPort(): string {
    return this.hostname() + ':' + this.port();
  }

}
