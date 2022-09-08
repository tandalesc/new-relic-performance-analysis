import { Chart } from 'primereact/chart';
import pattern from 'patternomaly';
import 'chartjs-adapter-date-fns';

import { ApdexProps, bucketLabels } from './ApdexAnalysis';

export const bucketColors = ['skyblue', 'mediumseagreen', 'goldenrod', 'salmon', 'grey', 'silver'];
const bucketPatterns = pattern.generate(bucketColors);

type BucketMap = { [key: number]: number };

const pointRadius = 0;
const borderWidth = 2;

interface ChartProps {
    apdex: ApdexProps,
    variant: 'pie'|'apdexLine'|'stfLine'|'responseTimeLine'
};

export function ApdexPieChart({ apdex }: ChartProps) {
    const pieOptions = {
        responsive: true,
        legend: {
            labels: {
                fontColor: '#495057'
            },
        },
    };
    const pieData = {
        labels: bucketLabels,
        datasets: [
            {
                type: 'pie',
                label: 'Apdex Buckets',
                data: Object.values(apdex.filteredApdexData.reduce((acc: BucketMap, { bucket }) => {
                    return { ...acc, [bucket]: (acc[bucket] ?? 0) + 1 };
                },
                    bucketLabels.reduce((acc, _, idx) => ({ ...acc, [idx]: 0 }), {})
                )).map(v => (v / apdex.filteredApdexData.length * 100).toFixed(3)),
                backgroundColor: bucketPatterns,
                borderColor: bucketPatterns,
            },
        ],
    };
    return <Chart className='apdexPie' type='pie' data={pieData} options={pieOptions} />;
}

export function ApdexLineChart({ apdex, variant = 'apdexLine' }: ChartProps) {
    const chartOptions: any = {
        responsive: true,
        legend: {
            labels: {
                fontColor: '#495057'
            },
        },
        scales: {
            x: {
                type: 'time',
                ticks: {
                    autoSkip: false,
                    major: { enabled: true },
                },
            },
            y: {
                min: 0,
                ticks: {
                    fontColor: '#495057',
                    stepSize: 0.05
                },
            },
        },
    };
    let datasets;
    if(variant === 'apdexLine') {
        datasets = [
            {
                type: 'line',
                label: 'Apdex',
                data: apdex.filteredApdexData.map(({ score }) => score),
                borderColor: 'grey',
                fill: false,
                pointRadius,
                borderWidth,
            },
        ];
        chartOptions.scales.y.max = 1.002;
    }
    if(variant === 'responseTimeLine') {
        datasets = [
            {
                type: 'line',
                label: 'Average Response Time (s)',
                data: apdex.filteredResponseTimeData.map(({ responseTime }) => responseTime/1000),
                borderColor: 'grey',
                fill: true,
                pointRadius,
                borderWidth,
            }
        ];
    }
    if(variant === 'stfLine') {
        datasets = [
            {
                type: 'line',
                label: 'Suceeding Txns',
                data: apdex.filteredApdexData.map(({ txnSuccess }) => txnSuccess),
                borderColor: 'mediumseagreen',
                fill: false,
                pointRadius,
                borderWidth,
            },
            {
                type: 'line',
                label: 'Tolerating Txns',
                data: apdex.filteredApdexData.map(({ txnTolerate }) => txnTolerate),
                borderColor: 'goldenrod',
                fill: false,
                pointRadius,
                borderWidth,
                borderDash: [5, 5, 2],
            },
            {
                type: 'line',
                label: 'Failed Txns',
                data: apdex.filteredApdexData.map(({ txnFail }) => txnFail),
                borderColor: 'darkblue',
                fill: false,
                pointRadius,
                borderWidth,
                borderDash: [2, 2],
            }
        ];
    }
    const chartData = {
        labels: apdex.filteredApdexData.map(({ to }) => to),
        datasets: datasets,
    };
    return <Chart className={variant} type='line' data={chartData} options={chartOptions} />;
}