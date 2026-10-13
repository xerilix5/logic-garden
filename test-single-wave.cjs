const {browserOptions,GAME_URL,output,input}=require('./test-helpers.cjs');
const {chromium}=require('playwright');const {execSync}=require('child_process');const fs=require('fs');
(async()=>{
 const browser=await chromium.launch(browserOptions());
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(GAME_URL);
 const report=await page.evaluate(async()=>{
   const output=[];let pops=0,turns=0,originalPop=animatePop;
   animatePop=(cells,token)=>{pops++;return originalPop(cells,token);};
   const random=Math.random;
   for(let scenario=0;scenario<4;scenario++) {
     currentLevel=[0,4,8,0][scenario];startLevel();goalScore=1e8;
     if(scenario===3)Math.random=()=>0;
     for(let i=0;i<30;i++) {
       movesLeft=100;const h=findHint();if(!h)throw Error('No legal move');
       const [p,q]=h,a=grid[p.y][p.x],b=grid[q.y][q.x];
       grid[p.y][p.x]=b;grid[q.y][q.x]=a;
       const expected=findGroups().reduce((sum,g)=>sum+pointsFor(g.length)*(g.some(p=>grid[p.y][p.x].bonus)?2:1),0);
       grid[p.y][p.x]=a;grid[q.y][q.x]=b;
       const before=score,popsBefore=pops;
       await tapCell(p.x,p.y);await tapCell(q.x,q.y);
       if(score-before!==expected)throw Error('Unexpected cascade score');
       if(pops-popsBefore!==1)throw Error('Extra removal wave');
       if(findGroups().length)throw Error('Refill produced an automatic group');
       if(movesLeft!==99||busy)throw Error('Incorrect turn state');
       if(grid.some((r,y)=>r.some((c,x)=>c.px!==x*CELL||c.py!==y*CELL||c.alpha!==1||c.scale!==1)))throw Error('Bad settled visual');
       turns++;
     }
     Math.random=random;
   }
   const finalScore=score;await new Promise(r=>setTimeout(r,400));
   if(score!==finalScore)throw Error('Score grows after completed turn');
   output.push('PASS '+turns+' turns: exactly one scoring event and one explosion wave per swap');
   output.push('PASS Refill leaves no automatic connected triples');
   output.push('PASS Constant random generator does not cause endless explosions');
   output.push('PASS Score remains unchanged after the turn');
   currentLevel=0;startLevel();
   return output;
 });
 if(errors.length)throw Error(errors.join('\n'));
 const html=fs.readFileSync(input('index.html'),'utf8');
 if(html.includes('document.activeElement === canvas')||html.includes('ctx.setLineDash'))throw Error('White cell focus border remains');
 report.push('PASS White per-cell keyboard-focus border removed');
 report.push('PASS No uncaught JavaScript errors');
 await page.screenshot({path:output('single-wave-preview.png')});
 fs.writeFileSync(output('single-wave-test-results.txt'),report.join('\n')+'\n');console.log(report.join('\n'));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
