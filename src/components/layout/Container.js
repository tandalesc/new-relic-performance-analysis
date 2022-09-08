
export function SingleColumnContainer({
    maxWidth = '650px',
    children
}) {
    return <>
        <div className='p-mt-4 p-mx-3 p-mx-md-auto p-d-flex p-flex-column' style={{ maxWidth }}>
            {children}
        </div>
    </>;
}