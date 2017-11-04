import { IncomingMessage, Server, ServerResponse } from 'http';
import { Socket } from 'net';

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
    this.server.on('request', (request: IncomingMessage, response: ServerResponse) => {
        response.write('Hello, World!');
        response.end();
      }
    );
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
    return 'http://' + this.hostname() + ':' + this.port();
  }

  private hostname(): string {
    return this.options.hostname;
  }

  private port(): number | undefined {
    const address = this.server.address();
    return address ? address.port : undefined;
  }

}
