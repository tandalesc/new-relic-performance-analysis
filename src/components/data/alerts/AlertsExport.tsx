import React, { useState } from 'react';

import { Button } from 'primereact/button';

import { AlertViolation } from 'pages/alerts/Violations';
import { formatDateYMD } from 'util/date/DateUtil';

function dateFromTimestamp(ts: number) {
    return (new Date(ts)).toLocaleString().replace(',', '');
}

function alertDataToCSV(data: AlertViolation[]) {
    let csv = `ID,Label,Duration,Opened At,Closed At,Condition Name,Priority\n`;
    csv += data.map(({ id, label, duration, opened_at, closed_at, condition_name, priority }) => (
        `${id},${label},${duration},${dateFromTimestamp(opened_at)},${dateFromTimestamp(closed_at)},${condition_name},${priority}`
    )).join('\n');
    return csv;
}

interface AlertExportProps {
    violations: AlertViolation[],
}

interface AlertExportOption {
    exportType: string,
    exportKey: string,
    mimeType: string,
    extension: string,
    content: string,
}

function AlertsExport({ violations }: AlertExportProps) {
    const [exportOptions, setExportOptions] = useState<AlertExportOption[]>([]);
    const [generated, setGenerated] = useState(false);
    const generateExportsOCL = () => {
        setExportOptions([
            { exportType: 'Alert Violations JSON', exportKey: 'alertViolations', mimeType: 'text/json', extension: 'json', content: encodeURIComponent(JSON.stringify(violations)) },
            { exportType: 'Alert Violations CSV', exportKey: 'alertViolations', mimeType: 'text/csv', extension: 'csv', content: alertDataToCSV(violations) },
        ]);
        setGenerated(true);
    };
    // add date to export file
    let exportFilename = 'export';
    let date = formatDateYMD(new Date());
    exportFilename += `_${date}`
    if (generated) {
        return <>
            {exportOptions.map(({ exportType, exportKey, mimeType, extension, content }) => (
                <React.Fragment key={exportType}>
                    <a href={`data:${mimeType};charset=utf-8,${content}`} download={`${exportKey}_${exportFilename}.${extension}`}>
                        Export {exportType}
                    </a>
                    <br />
                </React.Fragment>
            ))}
        </>
    } else {
        return <Button onClick={generateExportsOCL} label='Generate Exports' />;
    }
}

export default AlertsExport;