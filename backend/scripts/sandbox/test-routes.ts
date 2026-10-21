import { listRoutes } from './src/modules/tracking/tracking.service';

async function run() {
  const routes = await listRoutes({});
  console.dir(routes, { depth: null });
}
run().catch(console.error);
