import { useRef } from 'react';
import { observer } from 'mobx-react-lite';

import { Menubar } from 'primereact/menubar';
import { OverlayPanel } from 'primereact/overlaypanel';

import { AppConfigForm } from 'pages/Landing';
import { withContext } from 'config/context';
import { Button } from 'primereact/button';

export const menuHeight = 40;

function _ConnectionStatus({ newRelic }) {
    if (!newRelic.apiKey) {
        return <>Not Signed In</>;
    }
    if (!newRelic.appId) {
        return <>No App Selected</>;
    }
    return <>{newRelic.appTitle}</>;
}
const ConnectionStatus = observer(_ConnectionStatus);

function AppMenu({ context }) {
    const appConfigRef = useRef(null);
    const menu = useRef(null);
    const appLink = (url) => () => { context.changeRoute(url); };
    const modelSpa = [
        {
            label: 'Apdex',
            icon: 'pi pi-fw pi-book',
            command: appLink('/apdex'),
        },
        {
            label: 'Alerts',
            icon: 'pi pi-fw pi-exclamation-circle',
            items: [
                { label: 'Recent Events', icon: 'pi pi-fw pi-exclamation-circle', command: appLink('/alerts/events'), },
                { label: 'Violations', icon: 'pi pi-fw pi-exclamation-circle', command: appLink('/alerts/violations'), }
            ],
        },
    ];
    return <>
        <OverlayPanel ref={appConfigRef}>
            <div className='p-mt-3'>
                <AppConfigForm newRelic={context.newRelic} />
            </div>
        </OverlayPanel>
        <Menubar
            start={<Button onClick={(e) => { appConfigRef.current.toggle(e); }}><ConnectionStatus newRelic={context.newRelic} /></Button>}
            model={modelSpa}
            ref={menu}
            className='p-shadow-3'
        />
    </>;
}

export default withContext(AppMenu);