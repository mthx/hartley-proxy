import * as stream from 'stream';

/**
 * Utility to accumulate data and expose a buffer.
 */
export class BufferWritable extends stream.Writable {
  private chunks: Buffer[] = [];
  public _write(chunk: any, encoding: string, callback: (err?: Error) => void): void {
    this.chunks.push(chunk);
    callback();
  }
  public toBuffer(): Buffer {
    // Ensure we always return a copy.
    return this.chunks.length === 1
      ? Buffer.from(this.chunks[0])
      : Buffer.concat(this.chunks);
  }
}
