import { Proxy } from './proxy';

// tslint:disable no-console

async function app() {
  const proxy = new Proxy({ port: 8089 });
  await proxy.listen();
  console.log('Listening on ' + proxy.port());
}

app();
