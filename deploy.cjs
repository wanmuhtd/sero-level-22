// Publish the current dist snapshot while preserving the clean Pages history.
const {execFileSync}=require('node:child_process');
function git(...args){return execFileSync('git',args,{encoding:'utf8',windowsHide:true,env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'Never'}}).trim();}
git('fetch','origin','codex/pages');
const parent=git('rev-parse','refs/remotes/origin/codex/pages');
const tree=git('rev-parse','HEAD:dist');
const currentTree=git('rev-parse',parent+':');
if(tree===currentTree){console.log('Pages already matches the current game.');process.exit(0);}
const commit=git('commit-tree',tree,'-p',parent,'-m','Publish Sero birthday game');
git('push','origin',commit+':refs/heads/codex/pages');
git('update-ref','refs/heads/codex/pages',commit);
console.log('Published Pages source: '+commit);
