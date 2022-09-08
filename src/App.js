import { useEffect } from 'react';
import { BrowserRouter, Switch, Route, withRouter } from 'react-router-dom';
import PrimeReact from 'primereact/api';

import { AppContextProvider, withContext } from 'config/context';
import AppMenu from 'components/menu/AppMenu';
import AppFooter from 'components/footer/AppFooter';

import Landing from 'pages/Landing';
import Apdex from 'pages/apdex/Apdex';
import Events from 'pages/alerts/Events';
import Violations from 'pages/alerts/Violations';

// PrimeReact
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
// PrimeFlex
import 'primeflex/primeflex.css';
// App
import './App.scss';

PrimeReact.ripple = true;

function App({ location, history, context }) {
  // Inject history into global context
  useEffect(() => {
    context.history = history;
  }, [context, history])
  return (
    <div className='App'>
      <header>
        <AppMenu />
      </header>
      <main>
        <Switch location={location}>
          <Route exact path='/' component={Landing} />
          <Route path='/apdex' component={Apdex} />
          <Route path='/alerts/events' component={Events} />
          <Route path='/alerts/violations' component={Violations} />
        </Switch>
      </main>
      <footer>
        <AppFooter />
      </footer>
    </div>
  );
}

const AppWithRouter = withRouter(withContext(App));

const SinglePageApp = () => (
  <BrowserRouter>
    <AppContextProvider>
      <AppWithRouter />
    </AppContextProvider>
  </BrowserRouter>
)

export default SinglePageApp;