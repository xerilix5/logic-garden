const fs=require('fs'),path=require('path');
const {pathToFileURL}=require('url');
const {execSync}=require('child_process');
const dir=path.join(__dirname,'test-output');fs.mkdirSync(dir,{recursive:true});
function browserOptions(){
 let executablePath=process.env.CHROMIUM_PATH;
 if(!executablePath&&process.platform!=='win32')try{executablePath=execSync('command -v chromium || command -v chromium-browser',{stdio:['ignore','pipe','ignore']}).toString().trim();}catch{}
 return {headless:true,...(executablePath?{executablePath}:{}),...(process.platform==='linux'?{args:['--no-sandbox']}: {})};
}
module.exports={browserOptions,GAME_URL:pathToFileURL(path.join(__dirname,'index.html')).href,output:name=>path.join(dir,name),input:name=>path.join(__dirname,name)};
