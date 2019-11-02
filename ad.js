let { Client } = require('pg');
const readline = require('readline');
const token = process.env.TOKEN;
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
            let caption = ad_text.slice(0, -1);
            client.connect();
            client.query("SELECT COUNT (DISTINCT chat_id) FROM images;", (err, result) => {
                if (err == null){
                    result.rows.forEach((element) =>{
                        request("https://api.telegram.org/bot"+ token +
                           "/sendPhoto?chat_id=" + element +
                           "&photo=" + encodeURIComponent(ad_url)+
                           "&caption=" +encodeURIComponent(caption) +
                           "&parse_mode=Markdown");
                    });
                }
                client.end();
            });
        });
});