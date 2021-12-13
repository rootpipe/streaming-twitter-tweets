const config = require("dotenv").config();
const needle = require("needle");

const token = process.env.TWITTER_BEARER_TOKEN;
const ruleUrl = process.env.RULE_URL;
const streamUrl = process.env.STREAM_URL;

const rules = [{ value:process.env.SEARCH_TERM}];

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
  
  const streamTweets  = async (iosocket) => {
    const stream = needle.get(streamUrl, {
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  
    stream.on("data", (data) => {
      try {
        if(data){
          const json =  JSON.parse(data);
          iosocket.emit("tweet", json);
        }
      } catch (err) {
        
      }
    });
  
    let timeout = 0;
    stream.on("timeout", () => {
      // Reconnect on error
      console.warn("Reconnecting…");
      setTimeout(() => {
        timeout++;
        streamTweets(io);
      }, 5 ** timeout);
      streamTweets(io);
    });

  }

  const twitterInit = async () => {
    let currRules = await getRules();
    await deleteRules(currRules);
    await setRules();
  }
  
  module.exports = {
    twitterInit,
    streamTweets,
 }