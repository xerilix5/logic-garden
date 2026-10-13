const {browserOptions,GAME_URL,output,input}=require('./test-helpers.cjs');
const {chromium}=require('playwright');const {execSync}=require('child_process');const fs=require('fs');
(async()=>{
 const browser=await chromium.launch(browserOptions());
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await context.addInitScript(()=>localStorage.setItem('logic_garden_v2',JSON.stringify({unlockedLevel:6,lastPlayed:1,completed:[0],bestScores:{0:1230},session:{level:1,score:1100,moves:2,cells:[]}})));
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(GAME_URL);
 const result=await page.evaluate(()=>({unlockedLevel,currentLevel,completed,bestScores,score,movesLeft,goalScore,types:numTypes,text:$('status').textContent,goals:LEVELS.map(l=>l.goal)}));
 if(result.unlockedLevel!==6||result.currentLevel!==1||!result.completed.includes(0)||result.bestScores[0]!==1230)throw Error('Lost previous unlocks');
 if(result.score!==0||result.movesLeft!==24||result.goalScore!==1050)throw Error('Obsolete session limits');
 if(!result.text.includes('Баланс обновлён'))throw Error('Missing migration explanation');
 if(!result.goals.every((g,i)=>i===0||g>result.goals[i-1]))throw Error('Goals do not increase');
 if(errors.length)throw Error(errors.join('\n'));
 await page.screenshot({path:output('balanced-level2.png')});
 const report=['PASS Legacy in-progress session restarted with new balance','PASS Opened levels, completed levels and best scores preserved','PASS Level 2: 1050 points / 24 moves','PASS Goals strictly increase across all 12 levels','PASS No uncaught JavaScript errors'];
 fs.writeFileSync(output('balance-migration-test-results.txt'),report.join('\n')+'\n');console.log(report.join('\n'));await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
