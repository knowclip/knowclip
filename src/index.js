import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import rxjs from 'rxjs' // eslint-disable-line no-unused-vars
import App from './App'
import getStore from './redux'
import epic from './epics'
import './index.css';
import registerServiceWorker from './registerServiceWorker';

getStore().then(({ store, epicMiddleware }) => {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('root')
  );
  epicMiddleware.run(epic)
})
registerServiceWorker();
