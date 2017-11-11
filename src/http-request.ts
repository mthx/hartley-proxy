import * as http from 'http';
import {BufferWritable} from './writables';

/**
 * Completed incoming message and the body read from it.
 */
export interface IResponseWithBody {
  response: http.IncomingMessage;
  body: Buffer;
}

/**
 * Promise wrapper for http.request that reads the body into a buffer.
 * @param options Request details.
 */
export async function httpRequest(options: http.RequestOptions | string): Promise<IResponseWithBody> {
  return new Promise<IResponseWithBody>((resolve, reject) => {
    const bufferWritable = new BufferWritable();
    const request = http.request(options, (response: http.IncomingMessage) => {
      response.pipe(bufferWritable);
      response.on('end', () => resolve({response, body: bufferWritable.toBuffer()}));
    });
    request.on('error', e => reject(e));
    request.end();
  });
}
