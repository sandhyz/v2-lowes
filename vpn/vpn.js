const { spawn } = require('child_process');

exports.stop = async () => {
    try{
        const ls = await spawn('pm2', ['stop', `VPN`], { detached: true });
        ls.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
        ls.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
            ls.kill()
        });
        ls.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });
    } catch(err) {
        console.log(err)
    }

    return true
}


exports.start = async () => {
    try{
        const ls = await spawn('pm2', ['start', `VPN`], { detached: true });
        ls.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
        ls.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
            ls.kill()
        });
        ls.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });
    
    
    } catch(err) {
        console.log(err)
    }
    return true
}