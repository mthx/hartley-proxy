import {PassThrough} from 'stream';
import {BufferWritable} from '../src/writables';

describe('BufferWritable', () => {
  it('copies to buffer', () => {
    const dest = new BufferWritable();
    const source = new PassThrough();
    source.pipe(dest);
    source.write('foo');
    source.end('bar');
    expect(dest.toBuffer().toString()).toEqual('foobar');
  })
})
