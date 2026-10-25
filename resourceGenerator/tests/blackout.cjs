const {chromium}=require('playwright');
const fs=require('fs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const source=fs.readFileSync(require('path').join(__dirname,'../image-blackout.html'),'utf8');
 const fixture={id:'test',name:'Test "activity"',image:'data:image/svg+xml;base64,'+Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="red"/></svg>').toString('base64'),blackout:false,isPublic:true,labels:[{text:'One'},{text:'Two'}],zones:[{text:'One',x:10,y:30,w:14,h:8},{text:'Two',x:40,y:50,w:14,h:8}]};
 async function open(query,template=fixture){
  await page.unrouteAll();
  const mocks=`const firebaseConfig={},COLLECTIONS={blackout:'blackout'};
   const initializeApp=()=>({}),getAuth=()=>({}),getFirestore=()=>({});
   const doc=(...a)=>a,collection=(...a)=>a,where=()=>{},query=()=>{},serverTimestamp=()=>0;
   const getDoc=async()=>({exists:()=>true,data:()=>(${JSON.stringify(template)})});
   const getDocs=async()=>({docs:[]});
   const setDoc=async(...args)=>{if(window.failSave)throw Object.assign(new Error('Test database error'),{code:window.failSave});window.writes.push(args);};window.writes=[];
   const onAuthStateChanged=(auth,cb)=>cb({uid:'owner',displayName:'Teacher'});
   const deleteDoc=async()=>{};`;
  const html=source.replace(/<link href="https:[^>]+>/,'').replace(/import[\s\S]*?from\s+"[^"]+";/g,'').replace('<script type="module">','<script type="module">'+mocks).replace('</script>',`window.test={get:()=>({T,mode,showAll,viewPlaced}),loadTemplate,shareTemplate,stopSharing,saveTemplate,prepareImage,uploadImage,enterMode};</script>`);
  await page.route('https://test.local/**',r=>r.fulfill({contentType:'text/html',body:html}));
  await page.goto('https://test.local/image-blackout.html'+query);
  await page.waitForFunction(()=>window.test);
 }
 await open('?view=test');await page.waitForSelector('.dropzone');
 assert.equal(await page.locator('#sidebar').count(),0);
 assert.equal(await page.locator('[data-tab]').count(),0);
 assert.equal(await page.evaluate(()=>test.get().showAll),true);
 await page.click('#toggle-reveal');assert.equal(await page.evaluate(()=>test.get().showAll),false);
 await page.evaluate(()=>{const dt=new DataTransfer();dt.setData('text/plain','One');document.querySelector('[data-zone="One"]').dispatchEvent(new DragEvent('drop',{dataTransfer:dt}));});
 assert.equal(await page.locator('.dropzone.filled').count(),1);
 await page.setViewportSize({width:900,height:650});await page.waitForSelector('.dropzone.filled');
 assert.equal(await page.evaluate(()=>test.get().viewPlaced.One),true);
 assert.equal(await page.evaluate(()=>writes.length),0);
 await page.evaluate(()=>{
   const item=document.querySelector('[data-lbl="Two"]');
   const zone=document.querySelector('[data-zone="Two"]');const box=zone.getBoundingClientRect();
   item.dispatchEvent(new Event('touchstart'));
   const end=new Event('touchend');Object.defineProperty(end,'changedTouches',{value:[{clientX:box.x+box.width/2,clientY:box.y+box.height/2}]});item.dispatchEvent(end);
 });
 assert.equal(await page.locator('.dropzone.filled').count(),2);
 await open('?view=test',{...fixture,blackout:undefined});await page.waitForSelector('.dropzone');
 assert.equal(await page.evaluate(()=>test.get().showAll),false);
 await open('?view=test',{...fixture,isPublic:false});assert.match(await page.locator('#layout').innerText(),/unavailable/);
 await open('');await page.evaluate(t=>test.loadTemplate(t),fixture);await page.waitForSelector('#blackout-enabled');
 assert.equal(await page.isChecked('#blackout-enabled'),false);
 await page.check('#blackout-enabled');await page.click('#btn-save-t');
 await page.waitForFunction(()=>writes.length===1);assert.equal(await page.evaluate(()=>writes[0][1].blackout),true);
 await page.click('[data-tab="view"]');await page.waitForSelector('.dropzone');
 assert.equal(await page.evaluate(()=>test.get().showAll),false);
 await page.evaluate(()=>test.shareTemplate());assert.equal(await page.evaluate(()=>writes.at(-1)[1].isPublic),true);
 assert.match(await page.inputValue('#share-link'),/\?view=test$/);
 await page.evaluate(()=>test.stopSharing());assert.equal(await page.evaluate(()=>writes.at(-1)[1].isPublic),false);
 // A large PNG is optimized both on upload and when saving an existing activity.
 const large=await page.evaluate(()=>{
   const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=1000;
   const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(1400,1000);
   let seed=12345;
   for(let i=0;i<pixels.data.length;i+=4){
     for(let j=0;j<3;j++){seed=(Math.imul(seed,1664525)+1013904223)|0;pixels.data[i+j]=seed>>>24;}
     pixels.data[i+3]=255;
   }
   ctx.putImageData(pixels,0,0);return canvas.toDataURL('image/png');
 });
 assert.ok(large.length>1000000);
 await page.evaluate(t=>test.loadTemplate(t),{...fixture,image:large});
 const optimized=await page.evaluate(async()=>{
   const zones=JSON.stringify(test.get().T.zones);
   const saved=await test.saveTemplate();
   return {saved,length:test.get().T.image.length,zonesUnchanged:zones===JSON.stringify(test.get().T.zones),bytes:new Blob([JSON.stringify(writes.at(-1)[1])]).size};
 });
 assert.equal(optimized.saved,true);assert.ok(optimized.length<=650000);assert.ok(optimized.bytes<900000);assert.ok(optimized.zonesUnchanged);
 await page.evaluate(async data=>{
   const blob=await (await fetch(data)).blob();
   await test.uploadImage(new File([blob],'large.png',{type:'image/png'}));
 },large);
 assert.ok(await page.evaluate(()=>test.get().T.image.length<=650000));
 const dimensions=await page.evaluate(async()=>{
   const img=new Image();img.src=test.get().T.image;await img.decode();return {w:img.naturalWidth,h:img.naturalHeight};
 });
 assert.ok(Math.abs(dimensions.w/dimensions.h-1.4)<.01);
 // Save errors remain visible and retain the underlying Firebase code.
 await page.evaluate(()=>{window.failSave='permission-denied';});
 assert.equal(await page.evaluate(()=>test.saveTemplate()),false);
 assert.match(await page.locator('#save-error').innerText(),/permission-denied/);
 assert.equal(await page.locator('#save-error').isVisible(),true);
 await page.evaluate(()=>{window.failSave=null;});
 assert.equal(await page.evaluate(()=>test.saveTemplate()),true);
 assert.equal(await page.locator('#save-error').isVisible(),false);
 assert.deepEqual(errors,[]);
 console.log('PASS: sharing, blackout, mouse/touch placement, resize progress, large-image save/upload compression, aspect ratio/zone preservation, visible save errors and retry; no browser errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});

