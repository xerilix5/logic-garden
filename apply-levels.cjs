const fs=require('fs'),path=require('path');
const levels=JSON.parse(fs.readFileSync(path.join(__dirname,'levels.json'),'utf8'));
if(!Array.isArray(levels)||levels.length!==12||!levels.every((l,i)=>Number.isInteger(l.types)&&l.types>=4&&l.types<=6&&Number.isInteger(l.goal)&&l.goal>0&&Number.isInteger(l.moves)&&l.moves>0&&(i===0||l.goal>levels[i-1].goal)))throw Error('Invalid levels.json');
const file=path.join(__dirname,'index.html'),html=fs.readFileSync(file,'utf8');
if(!/const LEVELS = \[[\s\S]*?\];/.test(html))throw Error('LEVELS not found');
fs.writeFileSync(file,html.replace(/const LEVELS = \[[\s\S]*?\];/,'const LEVELS = '+JSON.stringify(levels,null,2)+';'));
console.log('Applied levels.json. Run npm test before publishing.');
