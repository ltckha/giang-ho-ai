const path=require('path');const {execFileSync}=require('child_process');
const pw=require(path.join(execFileSync('npm',['root','-g']).toString().trim(),'playwright'));
(async()=>{const b=await pw.chromium.launch();
for(const id of process.argv.slice(3)){const p=await b.newPage({viewport:{width:390,height:844}});
await p.goto('http://localhost:4179/?quay='+id);
await p.waitForFunction((sid)=>{const s=window.__GIANG_HO_GAME__?.scene.getScene('TdStageScene');return s&&s.sys.isActive()&&s.engine&&s.engine.stage.id===sid},id,{timeout:30000});
await p.waitForTimeout(2500);await p.screenshot({path:`${process.argv[2]}/moi_${id}.png`});await p.close();}
await b.close();})();
