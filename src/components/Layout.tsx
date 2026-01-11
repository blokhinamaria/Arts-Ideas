import { Outlet } from "react-router-dom";

import Header from './layout-components/Header.jsx'
import Footer from './layout-components/Footer.jsx'

export default function Layout() {
    return (
        <>
            <Header />
                <main>
                    <Outlet />
                </main>
            <Footer />
        </>
    )
}