// src/questionRenderer.js

function renderQuestion(
  q, answer, onAnswer,
  translations, lang,
  answers = {}, industries = []
) {
  const e = React.createElement;
  const labelText        = translations[q.key] || q.text || '';
  const instructionsText = q.instructions || '';

  function renderLabelAndInstructions() {
    const parts = [
      e('label',{
        key:'label',
        className:'block font-medium mb-1',
        htmlFor:q.key
      }, labelText)
    ];
    if (instructionsText) {
      parts.push(
        e('p',{
          key:'instr', className:'text-sm text-gray-600 mb-2'
        }, instructionsText)
      );
    }
    return parts;
  }

  const optsKey = `${q.key} | Options`;
  const raw     = translations[optsKey] || (q.options||[]).join(';');
  const options = raw.split(';').filter(o=>o);

  switch(q.type) {

    case 'text':
      return e('div',{ className:'mb-4' },
        e('p',{}, labelText)
      );

    case 'input':
      return e('div',{ className:'mb-4' },
        ...renderLabelAndInstructions(),
        e('input',{
          id:q.key, type:'text', value:answer||'',
          maxLength:500,
          onChange:ev=>onAnswer(ev.target.value),
          className:'w-full border rounded p-2'
        })
      );

    case 'select':
      return e('div',{ className:'mb-4' },
        ...renderLabelAndInstructions(),
        e('select',{
          id:q.key, value:answer||'',
          onChange:ev=>onAnswer(ev.target.value),
          className:'w-full border rounded p-2'
        },
          e('option',{value:'',disabled:true},
            translations[`${q.key}.placeholder`]
            || '— bitte wählen —'
          ),
          options.map(opt =>
            e('option',{key:opt,value:opt},opt)
          )
        )
      );

    case 'radio':
      return e('div',{ className:'mb-4' },
        ...renderLabelAndInstructions(),
        options.map(opt =>
          e('div',{key:opt,className:'flex items-center mb-1'},
            e('input',{
              type:'radio',name:q.key,value:opt,
              checked:answer===opt,
              onChange:()=>onAnswer(opt),
              className:'mr-2'
            }),
            e('label',{},opt)
          )
        )
      );

    case 'checkbox':
      const vals = Array.isArray(answer)
        ? answer
        : (answer?answer.toString().split(/,\s*/):[]);
      return e('div',{ className:'mb-4' },
        ...renderLabelAndInstructions(),
        options.map(opt =>
          e('div',{key:opt,className:'flex items-center mb-1'},
            e('input',{
              type:'checkbox',name:q.key,value:opt,
              checked:vals.includes(opt),
              onChange:ev=>{
                const next = ev.target.checked
                  ? [...vals,opt]
                  : vals.filter(v=>v!==opt);
                onAnswer(next);
              },
              className:'mr-2'
            }),
            e('label',{},opt)
          )
        )
      );

    case 'number':
      const formatted = formatNumber(answer);
      return e('div',{ className:'mb-4' },
        ...renderLabelAndInstructions(),
        e('input',{
          id:q.key, type:'text', inputMode:'numeric',
          value:formatted,
          onChange:ev=>onAnswer(parseNumber(ev.target.value)),
          className:'w-full border rounded p-2'
        })
      );

    case 'country': {
      const list   = COUNTRIES.de;
      const sorted = list.slice().sort((a,b)=>{
        const A = translations[`country.${a.code}`]||a.name;
        const B = translations[`country.${b.code}`]||b.name;
        return A.localeCompare(B,lang);
      });
      const ph = translations['country.placeholder']
        || (lang==='de'?'Bitte wählen':'Please select');
      return e('div',{ className:'mb-4' },
        ...renderLabelAndInstructions(),
        e('select',{id:q.key,value:answer||'',
          onChange:ev=>onAnswer(ev.target.value),
          className:'w-full border rounded p-2'
        },
          e('option',{value:'',disabled:true},ph),
          sorted.map(c=>
            e('option',{key:c.code,value:c.code},
              translations[`country.${c.code}`]||c.name
            )
          )
        )
      );
    }

    case 'region':
      return e('div',{ className:'mb-4' },
        ...renderLabelAndInstructions(),
        e(window.RegionSelect,{
          q,answer,onAnswer,
          translations,lang,answers
        })
      );

    case 'industries':
      return e('div',{ className:'mb-4' },
        ...renderLabelAndInstructions(),
        e(window.IndustrySelect,{
          q,answer,onAnswer,
          translations,lang,answers,industries
        })
      );

    case 'stars':
      return e('div',{ className:'mb-4' },
        ...renderLabelAndInstructions(),
        e('div',{ className:'flex space-x-1' },
          [1,2,3,4,5].map(n=>
            e('span',{ key:n,
              className:`cursor-pointer text-2xl ${
                answer>=n?'text-yellow-400':'text-gray-300'
              }`,
              onClick:()=>onAnswer(n)
            },answer>=n?'★':'☆')
          )
        )
      );

    default:
      return e('div',{ className:'mb-4' },
        ...renderLabelAndInstructions(),
        e('input',{id:q.key,type:'text',
          value:answer||'', maxLength:500,
          onChange:ev=>onAnswer(ev.target.value),
          className:'w-full border rounded p-2'
        })
      );
  }
}

window.renderQuestion = renderQuestion;
