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
   const setDoc=async(...args)=>{window.writes.push(args);};window.writes=[];
   const onAuthStateChanged=(auth,cb)=>cb({uid:'owner',displayName:'Teacher'});
   const deleteDoc=async()=>{};`;
  const html=source.replace(/<link href="https:[^>]+>/,'').replace(/import[\s\S]*?from\s+"[^"]+";/g,'').replace('<script type="module">','<script type="module">'+mocks).replace('</script>',`window.test={get:()=>({T,mode,showAll,viewPlaced}),loadTemplate,shareTemplate,stopSharing,enterMode};</script>`);
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
 assert.deepEqual(errors,[]);
 console.log('PASS: public view, private denial, blackout toggle/persistence, label placement, resize progress, no viewer writes, sharing and revocation; no browser errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});

