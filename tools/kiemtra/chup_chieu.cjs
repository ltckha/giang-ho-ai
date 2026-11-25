const path=require('path');const {execFileSync}=require('child_process');
const pw=require(path.join(execFileSync('npm',['root','-g']).toString().trim(),'playwright'));
(async()=>{const b=await pw.chromium.launch();
const id=process.argv[3];const p=await b.newPage({viewport:{width:390,height:844}});
await p.goto((process.argv[4]||'http://localhost:4179/')+'?quay='+id);
await p.waitForFunction((sid)=>{const s=window.__GIANG_HO_GAME__?.scene.getScene('TdStageScene');return s&&s.sys.isActive()&&s.engine&&s.engine.stage.id===sid},id,{timeout:30000});
await p.evaluate(()=>{window.__GIANG_HO_GAME__.scene.getScene('TdStageScene').speedMultiplier=6});
let n=0;for(let i=0;i<1400&&n<3;i++){await p.waitForTimeout(250);
 await p.evaluate(()=>{const e=window.__GIANG_HO_GAME__.scene.getScene('TdStageScene').engine;e.essence=Math.max(e.essence,2000);for(const t of e.towers){if(t.tier>=3&&e.canUnlockUltimate&&e.canUnlockUltimate(t.padId))e.unlockUltimate(t.padId);if(e.enemies.length>=4&&e.canActivateUltimate(t.padId)){e.activateUltimate(t.padId);break;}}});
 if(await p.$('[data-testid="td-ult-banner"]')){await p.evaluate(()=>{window.__GIANG_HO_GAME__.scene.getScene('TdStageScene').speedMultiplier=1});await p.waitForTimeout(250);await p.screenshot({path:`${process.argv[2]}/chieu_${id}_${n}.png`});n++;await p.waitForTimeout(2500);await p.evaluate(()=>{window.__GIANG_HO_GAME__.scene.getScene('TdStageScene').speedMultiplier=6});}}
console.log('chup',n);await b.close();})();
