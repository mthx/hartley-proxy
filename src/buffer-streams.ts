import * as stream from 'stream';

/**
 * Writable stream exposing a buffer.
 */
export class BufferWritable extends stream.Writable {
  private chunks: Buffer[] = [];
  public _write(
    chunk: any,
    encoding: string,
    callback: (err?: Error) => void
  ): void {
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
/**
 * Readable stream sourced from a buffer.
 */
export class BufferReadable extends stream.Readable {
  private data: Buffer;
  constructor(data: Buffer) {
    super();
    this.data = Buffer.from(data);
  }
  public _read(size: number): void {
    this.push(this.data);
    this.push(null);
  }
}
