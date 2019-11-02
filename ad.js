let { Client } = require('pg');
const readline = require('readline');
let client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
});
let request = require ('request');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let ad_url = "";
let ad_text = "";
rl.question("enter url of picture:",(url) => {
    ad_url = url;
    rl.write("Enter text of ad, end with CTRL-D:\n");
    rl.on("line", (input)=>{ad_text += input + "\n"})
        .on("close", () => {
            console.log("caption:", ad_text);
            console.log("photo:", ad_url);
        });
});