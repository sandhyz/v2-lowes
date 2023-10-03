const { spawn } = require('child_process');
const {messageBot} = require('./helpers');
require('dotenv').config();

let runReturn = async () => {
    try{   
        const timeout = 10 * 60 * 1000
        const ls = await spawn('node', ['/var/www/v2-lowes/return.js', '-batch', process.env.BATCH, '--index', process.env.INDEX], { detached: true });
        let timeoutId ;
        ls.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
            clearTimeout(timeoutId);
            timeoutId = setTimeout(async() => {
                console.log('Terminal tidak merespon dalam waktu 10 menit.');
                await messageBot('the terminal does not respond for 10 minutes, system will restart again')
                ls.kill(); 
                runReturn()
            }, timeout);
        });
        ls.on('exit', (code) => {
            clearTimeout(timeoutId);
        });
        ls.stderr.on('data', async (data) => {
            console.log(`stderr: ${data}`);
            ls.kill()
            await messageBot(`Error At : ${data}`)
        });
        ls.on('close', async (code) => {
            console.log(`child process exited with code ${code}`);
            if(code){
                await messageBot(`Critical Error Code : ${code}`)
            }
        });
    
    } catch(err) {
        console.log(err)
        await messageBot(`Error At : ${err}`)
    }
    return true
}

let run = async () => {
    try{   
        const timeout = 10 * 60 * 1000
        const ls = await spawn('node', ['/var/www/v2-lowes/lowes-by-sku.js', '--batch', process.env.BATCH, '--index', process.env.INDEX], { detached: true });
        let timeoutId ;
        ls.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
            clearTimeout(timeoutId);
            timeoutId = setTimeout(async() => {
                console.log('Terminal tidak merespon dalam waktu 10 menit.');
                await messageBot('the terminal does not respond for 10 minutes, system will restart again')
                ls.kill(); 
                runReturn()
            }, timeout);
        });
        ls.on('exit', (code) => {
            clearTimeout(timeoutId);
        });
        ls.stderr.on('data', async (data) => {
            console.log(`stderr: ${data}`);
            ls.kill()
            await messageBot(`Error At : ${data}`)
        });
        ls.on('close', async (code) => {
            console.log(`child process exited with code ${code}`);
            if(code){
                await messageBot(`Critical Error Code : ${code}`)
            }
        });
    
    } catch(err) {
        console.log(err)
        await messageBot(`Error At : ${err}`)
    }
    return true
}

run()
