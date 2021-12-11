const needle = require('needle');
const config = require('dotenv').config();
const token = process.env.TWITTER_BEARER_TOKEN;

const ruleUrl = process.env.RULE_URL;
const streamUrl =  process.env.STREAM_URL;

const rules = [{value:'node'}];


async function getRules(){
    
    const response = await needle('get', ruleUrl, {
            headers: {
                Authorization: `Bearer ${token}`
            },
    });
   
    return response.body;
}


async function setRules(){
   
    const data = {add: rules}

    const response = await needle('post', ruleUrl, data, {
            headers: {
                'content-type': 'application/json',
                Authorization: `Bearer ${token}`
            },
    });

      
    return response.body;
}


async function deleteRules(rules){
    
    if(!Array.isArray(rules.data)){
        return null;
    }

    const ids = rules.data.map((rule)=>rule.id);
    
    const data = {delete: {
        ids: ids
    }}

    const response = await needle('post', ruleUrl, data, {
            headers: {
                'content-type': 'application/json',
                Authorization: `Bearer ${token}`
            },
    });

    
    
    return response.body;
}

function streamTweets(){
    const stream = needle.get(streamUrl, {
        headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${token}`
        },
    });

    stream.on('data', (data)=>{
        try{

            const json = JSON.parse(data);
            console.log(json);

        }catch(err){}
    })
}

(async()=>{
    let currRules;

    try{

        currRules = await getRules();

        await deleteRules(currRules);
        await setRules();
        
    } catch(err){
        console.error(err);
        process.exit(1);
    }

    streamTweets();

})()