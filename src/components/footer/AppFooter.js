
const year = (new Date()).getFullYear();

function AppFooter() {
    return <>
        <div className='p-mx-auto p-my-5 p-d-flex p-jc-center'>
            &copy; {year}
        </div>
    </>;
}

export default AppFooter;