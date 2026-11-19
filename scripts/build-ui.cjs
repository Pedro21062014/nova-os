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
out('style.css',css(source('style.css'),{loader:'css',target:'chrome44',legalComments:'none',minifyWhitespace:true}).code);
