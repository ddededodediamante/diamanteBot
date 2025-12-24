const { parentPort, workerData } = require("worker_threads");
const effects = require(workerData.effectsPath);

parentPort.on("message", async ({ buffer, effect, isGif }) => {
  const startTime = performance.now();

  try {
    const input = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

    const out = await effects[effect](input, isGif);

    const timeMs = Math.round(performance.now() - startTime);

    if (out === "only_gif") {
      parentPort.postMessage({ result: "only_gif", timeMs });
      return;
    }

    parentPort.postMessage({ result: out, timeMs });
  } catch (err) {
    parentPort.postMessage({
      __ERR: err?.message ?? String(err),
    });
  }
});
