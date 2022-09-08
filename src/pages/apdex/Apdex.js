import { useState, useRef, useEffect } from 'react';

import { Button } from 'primereact/button';
import { SelectButton } from 'primereact/selectbutton';
import { Card } from 'primereact/card';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Calendar } from 'primereact/calendar';
import { Formik } from 'formik';

import { withContext } from 'config/context';
import ApdexExport from 'components/data/apdex/ApdexExport';
import ApdexAnalysis, { resolutionList } from 'components/data/apdex/ApdexAnalysis';
import { ApdexLineChart, ApdexPieChart } from 'components/data/apdex/ApdexChart';

import './Apdex.scss';

function ChartDownloadButton({ chart }) {
    const downloadOCL = () => {
        //get chart canvas
        const srcCanvas = document.querySelector(`.p-chart.${chart} canvas`);

        //add a white background
        const destinationCanvas = document.createElement("canvas");
        destinationCanvas.width = srcCanvas.width;
        destinationCanvas.height = srcCanvas.height;
        const destCtx = destinationCanvas.getContext('2d');
        //create a rectangle with the desired color
        destCtx.fillStyle = "#FFFFFF";
        destCtx.fillRect(0, 0, srcCanvas.width, srcCanvas.height);
        //draw the original canvas onto the destination canvas
        destCtx.drawImage(srcCanvas, 0, 0);

        //download image from destination canvas
        const link = document.createElement("a");
        link.download = `graphExport_${chart}.png`;
        link.href = destinationCanvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    return <Button onClick={downloadOCL} label='Export as PNG' />
}

function validateDataPickerForm(values) {
    const errors = {};
    if (!values.from) {
        errors.from = 'Required';
    }
    if (!values.to) {
        errors.to = 'Required';
    }
    if (!(values.from < values.to)) {
        errors.from = 'Must be before "To"';
        errors.to = 'Must be after "From"';
    }
    if (!values.resolution) {
        errors.resolution = 'Required';
    }
    return errors;
};

function ApdexForm({ apdex }) {
    return <>
        <Formik
            initialValues={apdex.formState}
            validate={validateDataPickerForm}
            onSubmit={(values, { setSubmitting }) => {
                apdex.setFormState(values);
                setSubmitting(false);
            }}>
            {formik => (
                <form onSubmit={formik.handleSubmit}>
                    <div className='p-fluid'>
                        <div className='p-grid'>
                            <div className='p-field p-col'>
                                <label htmlFor='from_input'>From</label>
                                <Calendar showTime hourFormat='12' id='from_input'
                                    className={formik.errors.from ? 'p-invalid' : ''}
                                    {...formik.getFieldProps('from')} />
                            </div>
                            <div className='p-field  p-col'>
                                <label htmlFor='from_input'>To</label>
                                <Calendar showTime hourFormat='12' id='to_input'
                                    className={formik.errors.to ? 'p-invalid' : ''}
                                    {...formik.getFieldProps('to')} />
                            </div>
                        </div>
                        <div className='p-field'>
                            <label htmlFor='resolution_input'>Resolution</label>
                            <SelectButton id='resolution_input' options={resolutionList}
                                className={formik.errors.resolution ? 'p-invalid' : ''}
                                {...formik.getFieldProps('resolution')} />
                        </div>
                        <Button type='submit' label='Update' />
                    </div>
                </form>
            )}
        </Formik>
    </>;
}

function ApdexGraphCard({ graph, apdex, title, }) {
    const graphComponent = (graph === 'apdexPie') ?
        <ApdexPieChart apdex={apdex} /> :
        <ApdexLineChart apdex={apdex} variant={graph} />;
    return (
        <Card className='p-shadow-3 p-mb-4' title={title}>
            {graphComponent}
            <div className='p-mt-3 p-d-flex p-flex-row-reverse'>
                <ChartDownloadButton chart={graph} />
            </div>
        </Card>
    );
}

function ApdexGraphs({ apdex }) {
    return <>
        <ApdexGraphCard apdex={apdex} graph='apdexLine' title='Apdex Time Series' />
        <ApdexGraphCard apdex={apdex} graph='stfLine' title='STF Time Series' />
        <ApdexGraphCard apdex={apdex} graph='responseTimeLine' title='Response Time' />
        <ApdexGraphCard apdex={apdex} graph='apdexPie' title='Apdex Buckets' />
    </>;
}

function ApdexSidebarToggle({ onClick, icon, label }) {
    return <>
        <div style={{
            zIndex: 100, marginTop: '1em',
            display: 'flex', justifyContent: 'center'
        }}>
            <Button onClick={onClick} icon={icon} label={label} className='p-button-rounded p-button-info' />
        </div>
    </>;
}

function ApdexActions({ apdex }) {
    const searchOverlayRef = useRef();
    const exportOverlayRef = useRef();
    return <>
        <OverlayPanel ref={searchOverlayRef}>
            <div className='p-mt-3'>
                <ApdexForm apdex={apdex} />
            </div>
        </OverlayPanel>
        <OverlayPanel ref={exportOverlayRef}>
            <div className='p-mt-3'>
                <ApdexExport apdex={apdex} />
            </div>
        </OverlayPanel>
        <div style={{
            position: 'sticky', top: '1em',
        }}>
            <ApdexSidebarToggle icon='pi pi-search' onClick={(e) => searchOverlayRef.current.toggle(e)} />
            <ApdexSidebarToggle icon='pi pi-cog' onClick={(e) => exportOverlayRef.current.toggle(e)} />
        </div>
    </>;
}

function Page({ context }) {
    const { newRelic } = context;
    return <>
        <ApdexAnalysis newRelic={newRelic}>
            {apdex => <>
                <div className='apdex-container p-mx-5 p-mt-3'>
                    <div>
                        <ApdexGraphs apdex={apdex} />
                    </div>
                    <div>
                        <ApdexActions apdex={apdex} />
                    </div>
                </div>
            </>}
        </ApdexAnalysis>
    </>;
}

export default withContext(Page);