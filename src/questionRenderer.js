// src/questionRenderer.js
(function(){
  function renderQuestion(
    q, answer, onAnswer, translations, lang, allAnswers
  ) {
    const e = React.createElement;
    const labelText = translations[q.key] || q.text || '';

    // Optionen-Key
    const optionsKey = q.key + ' | Options';
    const raw        = translations[optionsKey] || (q.options || []).join(';');
    const options    = raw.split(';').filter(opt => opt !== '');

    switch (q.type) {
      case 'text':
        return e('div',{
            className: 'mb-4'
          },
          e('p',{}, labelText)
        );

      case 'select':
        return e('div',{},
          e('label',{
              className:'block font-medium mb-1'
            },
            labelText
          ),
          e('select',{
              value: answer,
              onChange: ev => onAnswer(ev.target.value),
              className: 'w-full border rounded p-2'
            },
            options.map(opt =>
              e('option',{key:opt,value:opt},opt)
            )
          )
        );

      case 'radio':
        return e('div',{},
          e('label',{
              className:'block font-medium mb-1'
            },
            labelText
          ),
          options.map(opt =>
            e('div',{
                key:opt,
                className:'flex items-center mb-1'
              },
              e('input',{
                type:'radio',
                name:q.key,
                value:opt,
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
          : answer
            ? answer.toString().split(/,\s*/)
            : [];
        return e('div',{},
          e('label',{
              className:'block font-medium mb-1'
            },
            labelText
          ),
          options.map(opt =>
            e('div',{
                key:opt,
                className:'flex items-center mb-1'
              },
              e('input',{
                type:'checkbox',
                name:q.key,
                value:opt,
                checked:vals.includes(opt),
                onChange:ev=>{
                  let arr=[...vals];
                  if(ev.target.checked) arr.push(opt);
                  else arr=arr.filter(x=>x!==opt);
                  onAnswer(arr);
                },
                className:'mr-2'
              }),
              e('label',{},opt)
            )
          )
        );

      case 'number':
        const fmt = formatNumber(answer);
        return e('div',{},
          e('label',{
              className:'block font-medium mb-1'
            },
            labelText
          ),
          e('input',{
            type:'text',
            inputMode:'numeric',
            value:fmt,
            onChange:ev=>onAnswer(parseNumber(ev.target.value)),
            className:'w-full border rounded p-2'
          })
        );

      case 'country':
        // sortieren nach Label
        const list       = window.COUNTRIES.de;
        const sortedList = list.slice().sort((a,b)=>{
          const la = translations['country.'+a.code]||a.name;
          const lb = translations['country.'+b.code]||b.name;
          return la.localeCompare(lb,lang);
        });
        const placeholder = translations['country.placeholder']
          || (lang==='de'?'Bitte wählen':'Please select');

        return e('div',{},
          e('label',{
              className:'block font-medium mb-1'
            },
            labelText
          ),
          e('select',{
              value:answer||'',
              onChange:ev=>onAnswer(ev.target.value),
              className:'w-full border rounded p-2'
            },
            e('option',{value:'',disabled:true},placeholder),
            sortedList.map(c=>
              e('option',{key:c.code,value:c.code},
                translations['country.'+c.code]||c.name
              )
            )
          )
        );

      case 'regionmap':
        const countryCode = allAnswers['country']||'';
        if(!countryCode) return null;
        return e('div',{className:'mb-4'},
          e('p',{className:'block font-medium mb-1'},labelText),
          // global definierte RegionMap-Komponente
          e(window.RegionMap,{
            countryCode:countryCode,
            onSelect:onAnswer
          })
        );

      default:
        return e('div',{},
          e('label',{
              className:'block font-medium mb-1'
            },
            labelText
          ),
          e('input',{
            type:'text',
            value:answer,
            onChange:ev=>onAnswer(ev.target.value),
            className:'w-full border rounded p-2'
          })
        );
    }
  }

  // global verfügbar machen
  window.renderQuestion = renderQuestion;
})();
