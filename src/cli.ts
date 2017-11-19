import { Proxy } from './proxy';

// tslint:disable no-console

async function app() {
  const proxy = new Proxy({ port: 8089 });
  await proxy.listen();
  const { port } = proxy.url()!;
  console.log('Listening on ' + port);
}

app();
