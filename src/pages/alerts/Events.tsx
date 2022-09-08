import { FC, useEffect, useState } from "react";

import { withContext } from "config/context";

import RootStore from "stores/RootStore";
import NewRelicStore from "stores/NewRelicStore";
import { SingleColumnContainer } from "components/layout/Container";
import { Card } from "primereact/card";
import { Chip } from "primereact/chip";
import { SelectButton } from "primereact/selectbutton";

interface AlertEvent {
    id: number,
    event_type: 'NOTIFICATION' | 'INCIDENT_ACKNOWLEDGED' | 'INCIDENT_CLOSED' | 'VIOLATION_CLOSE' | 'INCIDENT_OPEN' | 'VIOLATION_OPEN',
    description: string,
    timestamp: number,
    incident_id: number,
    product?: 'BROWSER' | 'APM'
    entity_type?: string, entity_group_id?: number, entity_id?: number,
    priority?: 'Critical' | 'Warning',
}

const EventsList: FC<{ events: AlertEvent[] }> = ({ events }) => {
    if (events.length === 0) {
        return <p>No Data</p>;
    }
    return <>
        {events.map((e: AlertEvent) => {
            const dateString = (new Date(e.timestamp)).toLocaleString();
            let cardIcon = 'pi pi-cog';
            if (e.event_type === 'NOTIFICATION' || e.event_type === 'INCIDENT_ACKNOWLEDGED') {
                cardIcon = 'pi pi-exclamation-circle';
            }
            const header = (
                <div className='p-d-flex p-align-center p-justify-start p-mx-3 p-pt-3'>
                    <i className={`${cardIcon} p-mr-2`} />
                    <div className='p-d-flex p-flex-column'>
                        <span style={{ fontWeight: 600 }}>{e.event_type}</span>
                        <span>{dateString}</span>
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
                    {e.product && (
                        <Chip label={e.product} className='p-ml-2' />
                    )}
                </div>
            );
            return (
                <div key={e.id} className='p-mb-3'>
                    <Card header={header} footer={footer}>
                        <p>{e.description}</p>
                    </Card>
                </div>
            );
        })}
    </>;
};

type IncidentType = 'violations' | 'incidents' | 'notifications';
type ViolationPriority = 'Warning' | 'Critical';

const NewRelicAlertEvents: FC<{ newRelic: NewRelicStore }> = ({ newRelic }) => {
    const [events, setEvents] = useState<AlertEvent[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<AlertEvent[]>([]);
    const [incidentType, setIncidentType] = useState<IncidentType[]>(['incidents']);
    const [violationPriority, setViolationPriority] = useState<ViolationPriority[]>(['Critical']);
    const filterData = (_events: AlertEvent[]) => {
        setFilteredEvents(_events.filter(e => {
            if (e.event_type === 'INCIDENT_ACKNOWLEDGED' || e.event_type === 'INCIDENT_CLOSED' || e.event_type === 'INCIDENT_OPEN') {
                return incidentType.includes('incidents');
            }
            if (e.event_type === 'NOTIFICATION') {
                return incidentType.includes('notifications');
            }
            if (e.event_type === 'VIOLATION_CLOSE' || e.event_type === 'VIOLATION_OPEN') {
                // all violations have a priority
                return incidentType.includes('violations') && violationPriority.includes(e.priority!);
            }
            return false;
        }));
    }
    // initial event population
    useEffect(() => {
        (async () => {
            const _events = await (await newRelic.eventSummary()).json();
            const sortedEvents = _events.recent_events.sort((a: AlertEvent, b: AlertEvent) => b.timestamp - a.timestamp);
            setEvents(sortedEvents);
            filterData(sortedEvents);
        })();
    }, []);
    // filter data
    useEffect(() => {
        filterData(events);
    }, [incidentType, violationPriority]);
    const onIncidentTypeFilterChange = (e: any) => {
        setIncidentType(e.value);
    };
    const onPriorityFilterChange = (e: any) => {
        setViolationPriority(e.value);
    }
    if (events.length > 0) {
        return <>
            <div className='p-d-flex p-flex-column p-align-center p-mb-3'>
                <SelectButton value={incidentType} options={[
                    { label: 'Incidents', value: 'incidents' },
                    { label: 'Violations', value: 'violations' },
                    { label: 'Notifications', value: 'notifications' },
                ]} onChange={onIncidentTypeFilterChange} multiple />
                {incidentType.includes('violations') && (
                    <SelectButton className='p-mt-2' value={violationPriority} options={[
                        { label: 'Warning', value: 'Warning' },
                        { label: 'Critical', value: 'Critical' },
                    ]} onChange={onPriorityFilterChange} multiple />
                )}
            </div>
            <EventsList events={filteredEvents} />
        </>;
    }
    return <>Loading...</>;
};

const Page: FC<{ context: RootStore }> = ({ context }) => {

    return <>
        <SingleColumnContainer>
            <h1>Recent Events</h1>
            <NewRelicAlertEvents newRelic={context.newRelic} />
        </SingleColumnContainer>
    </>;
};

export default withContext(Page);