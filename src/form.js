// src/form.js (no JSX)

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
      alert('Submitted! You can edit via:\n' + link);
    })
    .catch(err => alert('Submission failed: ' + err.message));
  }

  render() {
    const { blocks, loading, error } = this.state;
    if (loading) {
      return React.createElement('div', null, 'Loading…');
    }
    if (error) {
      return React.createElement('div', null, 'Error: ' + error.message);
    }

    // build block elements
    const blockElements = blocks.map(block => {
      let inputElem;
      if (block.options) {
        const options = [React.createElement('option', { key: '_empty', value: '' }, '– choose –')].concat(
          block.options.map(opt =>
            React.createElement('option', { key: opt, value: opt }, opt)
          )
        );
        inputElem = React.createElement('select', {
          key: block.key + '_select',
          onChange: e => this.handleChange(block.key, e.target.value)
        }, ...options);
      } else {
        inputElem = React.createElement('input', {
          key: block.key + '_input',
          type: block.type || 'text',
          onChange: e => this.handleChange(block.key, e.target.value)
        });
      }
      return React.createElement('div', { key: block.key },
        React.createElement('label', { key: block.key + '_label' }, block.label),
        inputElem
      );
    });

    return React.createElement('div', null,
      ...blockElements,
      React.createElement('button', { onClick: this.handleSubmit }, 'Submit')
    );
  }
}

// parse URL params
const params = new URLSearchParams(window.location.search);
const uid    = params.get('uid');
const lang   = params.get('lang');

// render the form
ReactDOM.render(
  React.createElement(FormComponent, { uid: uid, lang: lang }),
  document.getElementById('nimbo-form')
);
