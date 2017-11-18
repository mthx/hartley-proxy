import * as http from 'http';
import { IncomingHttpHeaders, IncomingMessage, OutgoingHttpHeaders, RequestOptions, Server, ServerResponse } from 'http';
import { BufferWritable } from './buffer-streams';
import { ServerLifecycle } from './server-lifecycle';

/**
 * A stub server used for testing the proxy.
 */
export class BackendServer extends ServerLifecycle {

  constructor() {
    super(new Server((request: IncomingMessage, response: ServerResponse) => {
      const bufferWritable = new BufferWritable();
      response.writeHead(200, undefined, {'Content-Type': 'text/plain'});
      request.pipe(bufferWritable);
      bufferWritable.on('finish', () => {
        response.end(('Hello ' + bufferWritable.toBuffer().toString()).trim());
      });
    }), {port: 0, hostname: '127.0.0.1'});
  }

}
