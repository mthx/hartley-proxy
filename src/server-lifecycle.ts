import * as http from 'http';
import { Server } from 'http';
import * as https from 'https';
import * as url from 'url';

import { BufferWritable } from './buffer-streams';

export interface IListenOptions {
  port: number;
  hostname: string;
}

export class ServerLifecycle {

  constructor(private server: http.Server | https.Server, private options: IListenOptions) {
    this.server = server;
    this.options = options;
  }

  public on(event: string, listener: (...args: any[]) => void): void {
    this.server.on(event, listener);
  }

  public listen(): Promise<void> {
    const {port, hostname} = this.options;
    return new Promise((resolve, reject) => {
      this.server.listen(port, hostname, undefined, resolve);
    });
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close(resolve);
    });
  }

  public url(): url.Url | undefined {
    const protocol = this.server instanceof https.Server ? 'https:' : 'http:';
    const {address, port} = this.server.address();
    return address ? url.parse(`${protocol}//${address}:${port}`) : undefined;
  }

}
