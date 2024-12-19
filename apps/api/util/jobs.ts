export async function setupJobs() {}

let isShuttingDown: boolean = false;
export async function gracefulShutdown(signal: string, server: any) {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  console.info(`${signal} received. Gracefully shutting down.`);

  // Wait 30 seconds for existing connections to finish
  const timeout = setTimeout(() => {
    console.warn("Forcefully shutting down after 20 seconds.");
    process.exit(1); // Exit with a non-zero code to indicate an issue on shutdown
  }, 10000);

  timeout.unref();

  // Stop accepting new connections
  await server.close();

  console.log("Closed out remaining connections.");
  clearTimeout(timeout);

  process.exit(0);
}
