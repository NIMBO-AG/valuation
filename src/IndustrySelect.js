// src/IndustrySelect.js

function IndustrySelect({ answer, onAnswer, translations, lang, industries }) {
  const e = React.createElement;
  const [expanded, setExpanded] = React.useState({});

  function toggle(label) {
    setExpanded(prev=>({...prev,[label]:!prev[label]}));
  }

  function renderNodes(nodes, level=0) {
    return nodes.map(node => {
      const isLeaf     = !node.children || !node.children.length;
      const isExpanded = !!expanded[node.label];
      const indent     = { marginLeft: level*16 };
      const display    = translations[node.label]||node.label;

      if (!isLeaf) {
        return e('div',{key:node.label,style:indent},
          e('div',{
            className:'flex items-center cursor-pointer mb-1',
            onClick: ()=>toggle(node.label)
          },
            e('span',{style:{
              display:'inline-block',
              transform:isExpanded?'rotate(90deg)':'rotate(0deg)',
              transition:'transform .1s',
              width:12,height:12,marginRight:6
            }},'▸'),
            display
          ),
          isExpanded?renderNodes(node.children,level+1):null
        );
      }

      return e('div',{
        key:node.code,
        style:indent,
        className:`cursor-pointer mb-1 ${answer===node.code?'bg-blue-200':''}`,
        onClick:()=>onAnswer(node.code)
      }, display);
    });
  }

  // auto‐expand path if answer set
  React.useEffect(()=>{
    if(!answer) return;
    function findPath(ns,target,anc=[]){
      for(const n of ns){
        if(n.code===target) return anc;
        if(n.children){
          const p=findPath(n.children,target,anc.concat(n.label));
          if(p) return p;
        }
      }
      return null;
    }
    const path = findPath(industries,answer);
    if(path){
      const init={};
      path.forEach(l=>init[l]=true);
      setExpanded(init);
    }
  },[answer,industries]);

  return e('div',{}, renderNodes(industries));
}

window.IndustrySelect = IndustrySelect;
