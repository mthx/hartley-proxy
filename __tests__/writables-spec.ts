import {PassThrough} from 'stream';
import {BufferWritable} from '../src/writables';

describe('BufferWritable', () => {

  let dest: BufferWritable;
  let source: PassThrough;

  beforeEach(() => {
    dest = new BufferWritable();
    source = new PassThrough();
    source.pipe(dest);
  });

  it('copies to buffer', () => {
    source.write('foo');
    source.end('bar');
    expect(dest.toBuffer().toString()).toEqual('foobar');
    expect(dest.toBuffer()).toEqual(dest.toBuffer());
    expect(dest.toBuffer()).not.toBe(dest.toBuffer());
  })

  it('returns a new copy empty', () => {
    expect(dest.toBuffer()).not.toBe(dest.toBuffer());
  })

  it('returns a new copy after single write', () => {
    // Special case in the impl.
    source.end('foo');
    expect(dest.toBuffer()).not.toBe(dest.toBuffer());
  })

})
