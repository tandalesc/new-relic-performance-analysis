import React, { createContext } from 'react';

import RootStore from 'stores/RootStore';
// import DefaultLoginPage from '../pages/Login';

const rootStore = new RootStore();

export const AppContext = createContext();
export const AppContextProvider = (props) => (
    <AppContext.Provider value={rootStore}>
        {props.children}
    </AppContext.Provider>
);
export const withContext = (Component) => (props) => (
    <AppContext.Consumer>
        {context => <Component context={context} {...props} />}
    </AppContext.Consumer>
);
// export const withSecureContext = (Component, Fallback=DefaultLoginPage) => (props) => (
//     <AppContext.Consumer>
//         {context => {
//             if (context.auth.isLoggedIn) {
//                 return <Component context={context} {...props} />;
//             } else {
//                 return <Fallback context={context} {...props} />;
//             }
//         }}
//     </AppContext.Consumer>
// );