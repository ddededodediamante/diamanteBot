const { readFileSync, writeFileSync, existsSync } = require("fs");
const { toValidPath } = require("./path");

const DB_PATH = toValidPath("../data.json");

let cache = {};

function load() {
  if (!existsSync(DB_PATH)) {
    writeFileSync(DB_PATH, "{}");
  }

  const file = readFileSync(DB_PATH, "utf8");
  try {
    cache = JSON.parse(file);
  } catch (e) {
    console.error("Invalid JSON in database file.");
    cache = {};
  }
}

function save() {
  writeFileSync(DB_PATH, JSON.stringify(cache, null, 2));
}

function get(key) {
  return cache[key];
}

function set(key, value) {
  cache[key] = value;
  save();
}

function del(key) {
  delete cache[key];
  save();
}

function getAll() {
  return cache;
}

load();

module.exports = { load, get, set, del, getAll };
