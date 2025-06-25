import { ApolloClient, ApolloLink, ApolloProvider, HttpLink, InMemoryCache } from '@apollo/client';
import { Web3ReactProvider, createWeb3ReactRoot } from '@web3-react/core';
import 'inter-ui';
import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { NetworkContextName, graphEndPoints } from './constants';
import './i18n';
import App from './pages/App';
import store from './state';
import ApplicationUpdater from './state/application/updater';
import ListsUpdater from './state/lists/updater';
import MulticallUpdater from './state/multicall/updater';
import TransactionUpdater from './state/transactions/updater';
import UserUpdater from './state/user/updater';
import ThemeProvider, { FixedGlobalStyle, ThemedGlobalStyle } from './theme';
import getLibrary from './utils/getLibrary';

const Web3ProviderNetwork = createWeb3ReactRoot(NetworkContextName);

if ('ethereum' in window) {
  (window.ethereum as any).autoRefreshOnNetworkChange = false;
}

const getUriFromContext = (operation: any) => {
  const clientName = operation.getContext().clientName;
  return graphEndPoints[clientName] || 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2';
};

export const client = new ApolloClient({
  link: ApolloLink.split(
    (operation) => !!graphEndPoints[operation.getContext().clientName],
    new HttpLink({ uri: getUriFromContext }),
    new HttpLink({ uri: getUriFromContext })
  ),
  cache: new InMemoryCache(),
});

function Updaters() {
  return (
    <>
      <ListsUpdater />
      <UserUpdater />
      <ApplicationUpdater />
      <TransactionUpdater />
      <MulticallUpdater />
    </>
  );
}

// Error boundary component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh the page.</div>;
    }

    return this.props.children;
  }
}

// Wrap the app with error boundary
const AppWithErrorBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// Ensure the root element exists before rendering
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

ReactDOM.render(
  <StrictMode>
    <FixedGlobalStyle />
    <Web3ReactProvider getLibrary={getLibrary}>
      <Web3ProviderNetwork getLibrary={getLibrary}>
        <Provider store={store}>
          <Updaters />
          <ThemeProvider>
            <ThemedGlobalStyle />
            <BrowserRouter>
              <ApolloProvider client={client}>
                <AppWithErrorBoundary />
              </ApolloProvider>
            </BrowserRouter>
          </ThemeProvider>
        </Provider>
      </Web3ProviderNetwork>
    </Web3ReactProvider>
  </StrictMode>,
  rootElement
);
