// src/form.js

class FormComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      blocks: [],
      answers: {},
      loading: true,
      error: null,
    };
  }

  componentDidMount() {
    // load the questionnaire blocks
    fetch(`${window.location.origin}${window.location.pathname}?blocks=true`)
      .then(res => res.json())
      .then(blocks => this.setState({ blocks, loading: false }))
      .catch(error => this.setState({ error, loading: false }));
  }

  handleChange = (key, value) => {
    this.setState(state => ({
      answers: {
        ...state.answers,
        [key]: value
      }
    }));
  }

  handleSubmit = () => {
    const myValId = this.props.uid || '';
    const payload = {
      uuid: myValId,
      lang:  this.props.lang || 'en',
      answers: this.state.answers,
      link:  window.location.href
    };

    fetch('/exec', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.json())
    .then(json => {
      const link = `${window.location.origin}${window.location.pathname}?uid=${myValId}`;
      alert(`Submitted! You can edit via:\n${link}`);
    })
    .catch(err => alert(`Submission failed: ${err.message}`));
  }

  render() {
    const { blocks, loading, error } = this.state;
    if (loading) return <div>Loading…</div>;
    if (error)   return <div>Error: {error.message}</div>;

    return (
      <div>
        {blocks.map(block => (
          <div key={block.key}>
            <label>{block.label}</label>
            {block.options
              ? <select onChange={e => this.handleChange(block.key, e.target.value)}>
                  <option value="">– choose –</option>
                  {block.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              : <input
                  type={block.type || 'text'}
                  onChange={e => this.handleChange(block.key, e.target.value)}
                />
            }
          </div>
        ))}
        <button onClick={this.handleSubmit}>Submit</button>
      </div>
    );
  }
}

const params = new URLSearchParams(window.location.search);
const uid    = params.get('uid');
const lang   = params.get('lang');

ReactDOM.render(
  <FormComponent uid={uid} lang={lang} />,
  document.getElementById('root')
);
