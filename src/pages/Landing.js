import { useState, useEffect } from 'react';

import { observer } from 'mobx-react-lite';
import { Formik } from 'formik';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Card } from 'primereact/card';
import { Accordion, AccordionTab } from 'primereact/accordion';

import { withContext } from 'config/context';
import { SingleColumnContainer } from 'components/layout/Container';

function APIKeyForm({ newRelic }) {
    const { apiKey, setApiKey } = newRelic;
    return (
        <Formik initialValues={{ apiKey: apiKey ?? '' }}
            validate={(values) => { if (!values.apiKey) return { apiKey: 'Required' }; }}
            onSubmit={(values, { setSubmitting }) => {
                setApiKey(values.apiKey);
                setSubmitting(false);
            }}>
            {formik => (
                <form onSubmit={formik.handleSubmit}>
                    <div className='p-fluid p-grid p-formgrid'>
                        <div className='p-field'>
                            <label htmlFor='apiKey_input'>API Key</label>
                            <InputText id='apiKey_input'
                                className={formik.errors.apiKey ? 'p-invalid' : ''}
                                {...formik.getFieldProps('apiKey')} />
                        </div>
                        <Button type='submit' label='Save' />
                    </div>
                </form>
            )}
        </Formik>
    )
}

function AppSelection({ newRelic }) {
    const [apps, setApps] = useState(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        (async () => {
            if (apps === null) {
                setLoading(true);
                const res = await newRelic.applications();
                const data = await res.json();
                const nrApps = data.applications.map(({ name, id }) => ({
                    name: name,
                    id: id
                }));
                setApps(nrApps);
                setLoading(false);
            }
        })();
    }, [apps, setLoading, setApps, newRelic]);
    const updateAppDetailsOCL = (appId, appName) => () => {
        newRelic.setApp(appId, appName);
    }
    if (apps === null || loading) {
        return <p>Loading Apps...</p>
    }
    return <>
        <p>Select an environment below.</p>
        <div className='p-d-flex p-flex-column p-ai-start p-ml-2'>
            {apps.map(({ name, id }) => (
                <Button key={id} label={name}
                    onClick={updateAppDetailsOCL(id, name)}
                    className='p-button-lg p-mt-3' />
            ))}
        </div>
    </>;
}

function _AppConfigForm({ newRelic }) {
    const { apiKey, appId, appTitle } = newRelic;
    if (!apiKey) {
        return <APIKeyForm newRelic={newRelic} />;
    }
    if (!appId || !appTitle) {
        return (
            <AppSelection newRelic={newRelic} />
        );
    }
    const unsetApiKey = () => {
        newRelic.setApiKey(null);
    }
    const unsetAppDetails = () => {
        newRelic.setApp(null, null);
    }
    return <>
        <p>Selected {appTitle}</p>
        <div className='p-d-flex p-flex-column p-ai-stretch p-mt-3'>
            <Button label='Change API Key'
                onClick={unsetApiKey}
                className='p-button-lg' />
            <Button label='Change Application'
                onClick={unsetAppDetails}
                className='p-button-lg p-mt-3' />
        </div>
    </>;
}
export const AppConfigForm = observer(_AppConfigForm);

function Page({ context }) {
    const { newRelic } = context;
    return <>
        <SingleColumnContainer>
            <Card className='p-shadow-3' title='Welcome!'>
                <AppConfigForm newRelic={newRelic} />
            </Card>
        </SingleColumnContainer>
    </>;
}

export default withContext(Page);