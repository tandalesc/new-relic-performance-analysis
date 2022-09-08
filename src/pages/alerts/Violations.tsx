import { FC, useEffect, useState } from "react";

import { withContext } from "config/context";

import RootStore from "stores/RootStore";
import NewRelicStore from "stores/NewRelicStore";
import { SingleColumnContainer } from "components/layout/Container";
import AlertsExport from "components/data/alerts/AlertsExport";
import { Card } from "primereact/card";
import { Chip } from "primereact/chip";
import { Paginator } from "primereact/paginator";
import { SelectButton } from "primereact/selectbutton";

interface AlertViolationEntity {
    product: 'Apm' | 'Browser',
    type: 'Application' | 'BrowserApplication',
    group_id: number, id: number,
    name: string,
}
interface AlertViolationLinks {
    policy_id: number,
    condition_id: number,
    indicent_id?: number,
}

export interface AlertViolation {
    id: number,
    label: string,
    duration: number,
    policy_name: string, condition_name: string,
    priority: 'Critical' | 'Warning',
    opened_at: number, closed_at: number,
    entity: AlertViolationEntity,
    links: AlertViolationLinks,
}

const EventsList: FC<{ events: AlertViolation[] }> = ({ events }) => {
    if (events.length === 0) {
        return <p className='p-text-center'>No Data</p>;
    }
    return (
        <div className='p-d-flex p-flex-column p-align-center p-justify-center'>
            {events.map((e: AlertViolation) => {
                const dateFromString = (new Date(e.opened_at)).toLocaleString();
                const dateToString = (new Date(e.closed_at)).toLocaleString();
                const header = (
                    <div className='p-d-flex p-align-center p-justify-start p-mx-3 p-pt-3'>
                        <i className={`pi pi-exclamation-circle p-mr-2`} />
                        <div className='p-d-flex p-flex-column'>
                            <span style={{ fontWeight: 600 }}>{e.condition_name}</span>
                            <span>{dateFromString} - {dateToString}</span>
                        </div>
                    </div>
                );
                let chipColor = 'var(--yellow-100)';
                if (e.priority === 'Critical') {
                    chipColor = 'var(--orange-300)';
                }
                const footer = (
                    <div className='p-d-flex p-align-center p-justify-start'>
                        {e.priority && (
                            <Chip label={e.priority} style={{ backgroundColor: chipColor }} />
                        )}
                        {e.entity.product && (
                            <Chip label={e.entity.product} className='p-ml-2' />
                        )}
                    </div>
                );
                return (
                    <div key={e.id} className='p-mb-3' style={{ width: '100%' }}>
                        <Card header={header} footer={footer}>
                            <p>{e.label}</p>
                        </Card>
                    </div>
                );
            })}
        </div>
    );
};

type ViolationPriority = 'Warning' | 'Critical';

const NewRelicAlertViolations: FC<{ newRelic: NewRelicStore }> = ({ newRelic }) => {
    const [events, setEvents] = useState<AlertViolation[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<AlertViolation[]>([]);
    const [eventsPage, setEventsPage] = useState<AlertViolation[]>([]);
    const [apiPage, setApiPage] = useState(1);
    const [page, setPage] = useState(0);
    const [rows, setRows] = useState(12);
    const [violationPriority, setViolationPriority] = useState<ViolationPriority[]>(['Warning', 'Critical']);
    const processData = (_events: AlertViolation[]) => {
        const filteredEvents = _events
            .sort((a: AlertViolation, b: AlertViolation) => b.closed_at - a.closed_at)
            .filter(e => violationPriority.includes(e.priority!));
        setFilteredEvents(filteredEvents);
        setEventsPage(filteredEvents.filter((_, i) => (i > page * rows && i <= (page + 1) * rows)));
    }
    const getData = async (p = apiPage) => {
        const _events = await (await newRelic.violationPaginated(p)).json();
        const newEvents = events.concat(_events.violations);
        setApiPage(p);
        setEvents(newEvents);
        processData(newEvents);
    }
    // initial event population
    useEffect(() => {
        getData();
    }, []);
    // filter data
    useEffect(() => {
        processData(events);
    }, [violationPriority, page, rows]);
    // update page selection
    const onPageChange = async (e: any) => {
        // detect cases when we run out of data and need to increment api page
        if ((e.page + 1) * rows > filteredEvents.length) {
            await getData(apiPage + 1);
        }
        setPage(e.page);
    };
    const onPriorityFilterChange = (e: any) => {
        setViolationPriority(e.value);
    }
    if (events.length > 0) {
        return <>
            <div className='p-d-flex p-flex-column p-align-center'>
                <SelectButton className='p-my-2' value={violationPriority} options={[
                    { label: 'Warning', value: 'Warning' },
                    { label: 'Critical', value: 'Critical' },
                ]} onChange={onPriorityFilterChange} multiple />
                <AlertsExport violations={events} />
            </div>
            <div className='' style={{ position: 'sticky', top: 0 }}>
                <div className='p-mb-2 p-py-2 p-d-flex p-flex-column p-align-center' style={{ width: 'calc(100% + 2em)', position: 'relative', left: '-1em', backgroundColor: 'var(--surface-100)' }}>
                    <Paginator first={page * rows} rows={rows} totalRecords={filteredEvents.length + rows} onPageChange={onPageChange} />
                </div>
            </div>
            <EventsList events={eventsPage} />
        </>;
    }
    return <>Loading...</>;
};

const Page: FC<{ context: RootStore }> = ({ context }) => {

    return <>
        <SingleColumnContainer>
            <h1>Violations</h1>
            <NewRelicAlertViolations newRelic={context.newRelic} />
        </SingleColumnContainer>
    </>;
};

export default withContext(Page);