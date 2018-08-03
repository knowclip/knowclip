import 'rxjs' // eslint-disable-line no-unused-vars
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import App from './App'
import getStore from './redux'
// import epic from './epics'
import './index.css';
import registerServiceWorker from './registerServiceWorker';

getStore().then((store) => {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('root')
  );
})
registerServiceWorker();
