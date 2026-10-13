const fs=require('fs'),vm=require('vm');
const path=require('path');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const constants=html.slice(html.indexOf('const LEVELS'),html.indexOf('// Logic Garden'));
const js=html.slice(html.indexOf('// Logic Garden'),html.indexOf('</script>')).split("canvas.addEventListener('pointerdown'")[0];
const node=()=>({getContext:()=>({}),classList:{toggle(){}},setAttribute(){},focus(){},getBoundingClientRect(){return {left:0,top:0,width:490,height:490};}});
const context={document:{getElementById:node},matchMedia:()=>({matches:true,addEventListener(){}}),console,setTimeout,clearTimeout};vm.createContext(context);
vm.runInContext(constants+'\n'+js,context);
const run=`
let seed=123456789;
Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
function legalOptions(){
 const options=[];
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)for(const [dx,dy]of [[1,0],[0,1]]){
  const xx=x+dx,yy=y+dy;if(xx>=SIZE||yy>=SIZE)continue;
  const a=grid[y][x],b=grid[yy][xx];if(a.type===b.type)continue;
  grid[y][x]=b;grid[yy][xx]=a;
  const groups=[findGroup(x,y),findGroup(xx,yy)].filter(g=>g.length>=3);
  if(groups.length){const pts=groups.reduce((s,g)=>s+pointsFor(g.length)*(g.some(p=>grid[p.y][p.x].bonus)?2:1),0);options.push({x,y,xx,yy,pts,groups});}
  grid[y][x]=a;grid[yy][xx]=b;
 }
 return options;
}
const samples=[];
for(const types of [4,5,6])for(const policy of ['random','thoughtful','greedy']){
 for(let trial=0;trial<100;trial++){
  numTypes=types;initGrid();let total=0;const scores=[];
  for(let turn=1;turn<=34;turn++){
   let options=legalOptions();if(!options.length){initGrid();options=legalOptions();}
   options.sort((a,b)=>b.pts-a.pts);
   const limit=policy==='random'?options.length:policy==='thoughtful'?Math.max(1,Math.ceil(options.length/3)):1;
   const pick=options[Math.floor(Math.random()*limit)];
   const a=grid[pick.y][pick.x],b=grid[pick.yy][pick.xx];grid[pick.y][pick.x]=b;grid[pick.yy][pick.xx]=a;
   total+=pick.pts;pick.groups.flat().forEach(p=>grid[p.y][p.x]=null);
   const fall=fillAndFall();prepareStableRefill(fall);fall.forEach(m=>{m.cell.py=m.target;});
   if(findGroups().length)throw Error('Automatic groups');
   scores.push(total);
  }
  samples.push({types,policy,trial,scores});
 }
 console.log('Completed',types,policy);
}
JSON.stringify(samples);
`;
const result=vm.runInContext(run,context);const dir=path.join(__dirname,'test-output');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'balance-simulations.json'),result);
const samples=JSON.parse(result),summary=[];
for(const types of [4,5,6])for(const policy of ['random','thoughtful','greedy'])for(const moves of [22,24,26,28,30,32,34]){
 const scores=samples.filter(s=>s.types===types&&s.policy===policy).map(s=>s.scores[moves-1]).sort((a,b)=>a-b);
 const q=p=>scores[Math.floor((scores.length-1)*p)];summary.push({types,policy,moves,p10:q(.1),p25:q(.25),median:q(.5),p75:q(.75),p90:q(.9)});
}
fs.writeFileSync(path.join(__dirname,'test-output','balance-summary.json'),JSON.stringify(summary,null,2));console.table(summary.filter(s=>s.moves===24||s.moves===30));
