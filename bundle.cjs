const fs=require('node:fs'),path=require('node:path');
const base=path.join(__dirname,'dist');let html=fs.readFileSync(path.join(base,'index.html'),'utf8');
for(const file of ['style.css','mobile.css','ride.css','responsive.css'])html=html.replace(new RegExp('<link rel="stylesheet" href="'+file.replace('.','\\.')+'(?:\\?[^\"]*)?">'),()=>`<style>${fs.readFileSync(path.join(base,file),'utf8')}</style>`);
for(const file of ['config.js','ride.js','game.js'])html=html.replace(new RegExp('<script src="'+file.replace('.','\\.')+'(?:\\?[^\"]*)?"></script>'),()=>`<script>${fs.readFileSync(path.join(base,file),'utf8')}</script>`);
for(const file of ['character-blonde.png','character-walk.png','kebab-scoopy.png','memory.png'])html=html.replaceAll(`assets/${file}`,`data:image/png;base64,${fs.readFileSync(path.join(base,'assets',file)).toString('base64')}`);
fs.mkdirSync(path.join(__dirname,'release'),{recursive:true});fs.writeFileSync(path.join(__dirname,'release','Sero-Level-22.html'),html);
console.log('Standalone HTML ready: release/Sero-Level-22.html');
