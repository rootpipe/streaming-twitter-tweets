const needle = require("needle");
const config = require("dotenv").config();
const express = require("express");
const http = require("http");
const token = process.env.TWITTER_BEARER_TOKEN;
const ruleUrl = process.env.RULE_URL;
const streamUrl = process.env.STREAM_URL;
const PORT = process.env.PORT;
const rules = [{ value:process.env.SEARCH_TERM}];
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

async function getRules() {
  const response = await needle("get", ruleUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  //console.log("rules", response.body);
  return response.body;
}

async function setRules() {
  const data = { add: rules };

  const response = await needle("post", ruleUrl, data, {
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return response.body;
}

async function deleteRules(rules) {
  if (!Array.isArray(rules.data)) {
    return null;
  }

  const ids = rules.data.map((rule) => rule.id);

  const data = {
    delete: {
      ids: ids,
    },
  };

  const response = await needle("post", ruleUrl, data, {
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  //console.log("delete reuls", response.body);
  return response.body;
}

function streamTweets(iosocket) {
  const stream = needle.get(streamUrl, {
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  stream.on("data", (data) => {
    try {
      const json = JSON.parse(data);
      iosocket.emit("tweet", json);
    } catch (err) {}
  });

  return stream;
}

io.on("connection", async () => {
  console.log("Client connected...");

  let currentRules;

  try {
    currentRules = await getRules();

    await deleteRules(currentRules);

    await setRules();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  const filteredStream = streamTweets(io);

  let timeout = 0;
  filteredStream.on("timeout", () => {
    // Reconnect on error
    console.warn("Reconnecting…");
    setTimeout(() => {
      timeout++;
      streamTweets(io);
    }, 5 ** timeout);
    streamTweets(io);
  });
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
