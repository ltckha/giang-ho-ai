const path=require('path');const fs=require('fs');const {execFileSync}=require('child_process');
const pw=require(path.join(execFileSync('npm',['root','-g']).toString().trim(),'playwright'));
const A=process.argv[2];const SH=+process.argv[3],NS=+process.argv[4];const ids=JSON.parse(fs.readFileSync(A+'/ids.json')).filter((_,i)=>i%NS===SH);
const resFile=A+'/ketqua_'+SH+'.json';const res=fs.existsSync(resFile)?JSON.parse(fs.readFileSync(resFile)):{};
(async()=>{const b=await pw.chromium.launch();
for(const id of ids){ if(res[id]) continue;
 const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 const t0=Date.now();
 try{
 await p.goto('http://localhost:4179/?quay='+id);
 await p.waitForFunction((sid)=>{const s=window.__GIANG_HO_GAME__?.scene.getScene('TdStageScene');return s&&s.sys.isActive()&&s.engine&&s.engine.stage.id===sid},id,{timeout:30000});
 await p.waitForTimeout(1500);
 await p.screenshot({path:`${A}/anh/${id}_1_vao.png`});
 await p.evaluate(()=>{window.__GIANG_HO_GAME__.scene.getScene('TdStageScene').speedMultiplier=6});
 let midShot=false;const start=Date.now();let info;
 while(Date.now()-start<150000){
  await p.waitForTimeout(2000);
  info=await p.evaluate(()=>{const s=window.__GIANG_HO_GAME__.scene.getScene('TdStageScene');const e=s.engine;return {st:e.status,wave:e.currentWaveIndex+1,total:e.getTotalWaves(),lives:e.lives,max:e.maxLives,enemies:e.enemies.length,towers:e.towers.map(t=>t.defId+':'+t.tier).join(' '),stage:e.stage.id}});
  if(info.st!=='playing') break;
  if(!midShot && info.wave>=Math.ceil(info.total/2) && info.enemies>2){await p.screenshot({path:`${A}/anh/${id}_2_giua.png`});midShot=true;}
 }
 if(!midShot) await p.screenshot({path:`${A}/anh/${id}_2_giua.png`});
 await p.waitForTimeout(2500);await p.screenshot({path:`${A}/anh/${id}_3_cuoi.png`});
 res[id]={...info,giay:Math.round((Date.now()-t0)/1000),loi:errs.slice(0,5)};
 }catch(e){res[id]={loiChay:String(e.message).slice(0,200),loi:errs.slice(0,5)};}
 fs.writeFileSync(resFile,JSON.stringify(res,null,1));console.log(id,JSON.stringify(res[id]).slice(0,160));
 await p.close();}
await b.close();})();
