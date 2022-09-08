import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';

import { ApdexScoredPoint, ApdexProps, bucketLabels, ResponseTimeScoredPoint } from 'components/data/apdex/ApdexAnalysis';
import { formatDateYMD, formatDateYMDHMS } from 'util/date/DateUtil';

function dateFromTimestamp(ts: number) {
    return (new Date(ts)).toLocaleString().replace(',', '');
}

function apdexDataToCSV(data: ApdexScoredPoint[]) {
    let csv = `Score,Bucket,From,To,Is Business Hours,Day of Week,Hour,Txn Count,Txn Success,Txn Fail,Txn Tolerating\n`;
    csv += data.map(({ score, bucket, from, to, businessHours, dayOfWeek, hour, txnCount, txnSuccess, txnFail, txnTolerate }) => `${score},${bucketLabels[bucket]},${dateFromTimestamp(from)},${dateFromTimestamp(to)},${businessHours},${dayOfWeek},${hour},${txnCount},${txnSuccess},${txnFail},${txnTolerate}`).join('\n');
    return csv;
}

function responseTimeDataToCSV(data: ResponseTimeScoredPoint[]) {
    let csv = `Average Response Time (ms),Request Count,From,To\n`;
    csv += data.map(({ from, to, responseTime, requestCount }) => `${responseTime},${requestCount},${dateFromTimestamp(from)},${dateFromTimestamp(to)}`).join('\n');
    return csv;
}

function slaReport(apdex: ApdexScoredPoint[], responseTime: ResponseTimeScoredPoint[]) {
    let csv = `Score,Bucket,From,To,Is Business Hours,Day of Week,Hour,Txn Count,Txn Success,Txn Fail,Txn Tolerating,Average Response Time (ms),Request Count\n`;
    csv += apdex.map(({ score, bucket, from, to, businessHours, dayOfWeek, hour, txnCount, txnSuccess, txnFail, txnTolerate }, i) => `${score},${bucketLabels[bucket]},${dateFromTimestamp(from)},${dateFromTimestamp(to)},${businessHours},${dayOfWeek},${hour},${txnCount},${txnSuccess},${txnFail},${txnTolerate},${responseTime[i].responseTime},${responseTime[i].requestCount}`).join('\n');
    return csv;
}

interface ApdexExportProps {
    apdex: ApdexProps,
}

interface ApdexExportOption {
    exportType: string,
    exportKey: string,
    mimeType: string,
    extension: string,
    content: string,
}

function ApdexExport({ apdex }: ApdexExportProps) {
    const { formState, apdexData, responseTimeData } = apdex;
    const { from, to, resolution } = formState;
    const [exportOptions, setExportOptions] = useState<ApdexExportOption[]>([]);
    const [generated, setGenerated] = useState(false);
    const generateExportsOCL = () => {
        setExportOptions([
            { exportType: 'Apdex JSON', exportKey: 'apdex', mimeType: 'text/json', extension: 'json', content: encodeURIComponent(JSON.stringify(apdexData)) },
            { exportType: 'Apdex CSV', exportKey: 'apdex', mimeType: 'text/csv', extension: 'csv', content: apdexDataToCSV(apdexData) },
            { exportType: 'Response Time JSON', exportKey: 'responseTime', mimeType: 'text/json', extension: 'json', content: encodeURIComponent(JSON.stringify(responseTimeData)) },
            { exportType: 'Response TIme CSV', exportKey: 'responseTime', mimeType: 'text/csv', extension: 'csv', content: responseTimeDataToCSV(responseTimeData) },
            { exportType: 'SLA Report CSV', exportKey: 'slaReport', mimeType: 'text/csv', extension: 'csv', content: slaReport(apdexData, responseTimeData) },
        ]);
        setGenerated(true);
    };
    // add date to export file
    let exportFilename = 'export';
    let fromDt = formatDateYMD(from);
    let toDt = formatDateYMD(to);
    if (fromDt === toDt) {
        fromDt = formatDateYMDHMS(from);
        toDt = formatDateYMDHMS(to);
        exportFilename += `_${fromDt}`;
    } else {
        exportFilename += `_${fromDt}_${toDt}`;
    }
    if(generated) {
        return exportOptions.map(({ exportType, exportKey, mimeType, extension, content }) => (
            <React.Fragment key={exportType}>
                <a href={`data:${mimeType};charset=utf-8,${content}`} download={`${exportKey}_${exportFilename}_${resolution}.${extension}`}>
                    Export {exportType}
                </a>
                <br />
            </React.Fragment>
        ));
    } else {
        return <Button onClick={generateExportsOCL} label='Generate Exports' />;
    }
}

export default ApdexExport;