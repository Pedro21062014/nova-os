const {transformSync: css}=require('esbuild');
const {transformSync: js}=require('@babel/core');
const {parse}=require('acorn');
const {readFileSync,writeFileSync}=require('node:fs');
const path=require('node:path');
const project=path.resolve(__dirname,'..');
const source=name=>readFileSync(path.join(project,'ui',name),'utf8');
const out=(name,data)=>writeFileSync(path.join(project,'app/src/main/assets',name),data.trimEnd()+'\n');
const {code}=js(source('app.js'),{
  babelrc:false,configFile:false,sourceType:'script',comments:false,compact:true,
  presets:[[require('@babel/preset-env'),{targets:{chrome:'44'},forceAllTransforms:true,modules:false}]]
});
parse(code,{ecmaVersion:5});
out('app.js',code);
// Chrome 52 drops an entire selector list if one of its selectors is unknown.
// Emit usable branches in their original order, retaining modern rules and the cascade.
function expand(sel){
  const match=/:is\(([^()]*)\)/.exec(sel);
  return match ? match[1].split(',').flatMap(part=>expand(sel.slice(0,match.index)+part+sel.slice(match.index+match[0].length))) : [sel];
}
function scope(sel){
  return /^body(?=[.#:\s]|$)/.test(sel) ? sel.replace(/^body/,'body.legacy-layout') : 'body.legacy-layout '+sel;
}
const compatible=source('style.css').replace(/([^{}]+)\{([^{}]*)\}/g,(full,raw,decl)=>{
  const sel=raw.replace(/\/\*[\s\S]*?\*\//g,'').trim();
  if(!sel||sel[0]==='@'||!decl.includes(':'))return full;
  // Expand groups one selector at a time; split lists only outside parentheses.
  const parts=sel.split(/,(?![^()]*\))/).flatMap(expand).map(x=>x.trim()).filter(x=>x&&!x.includes(':focus-visible'));
  let additions='';
  if(parts.length&&(/:is\(|:focus-visible/.test(sel)))additions+=parts.map(scope).join(',')+'{'+decl+'}';
  const weight=/font-weight:(650|750)\b/.exec(decl);
  if(parts.length&&weight)additions+=parts.map(scope).join(',')+'{font-family:"Nova Manrope '+weight[1]+'",Nova Manrope,Arial,sans-serif;font-weight:400}';
  return full+additions;
});
out('style.css',css(compatible,{loader:'css',target:'chrome44',legalComments:'none',minifyWhitespace:true}).code);
