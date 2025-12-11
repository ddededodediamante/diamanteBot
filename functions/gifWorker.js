const { parentPort, workerData } = require("worker_threads");
const effects = require(workerData.effectsPath); 

parentPort.on("message", async (inputBuffer) => {
  try {
    const buffer = Buffer.isBuffer(inputBuffer) ? inputBuffer : Buffer.from(inputBuffer);

    const out = await effects[workerData.effect](buffer, workerData.contentType);

    if (out === "only_gif") {
      parentPort.postMessage("only_gif");
      return;
    }

    parentPort.postMessage(out, [out.buffer]);
  } catch (err) {
    parentPort.postMessage({ __ERR: err && err.message ? err.message : String(err) });
  }
});
