import 'bootstrap/dist/css/bootstrap.min.css'
import './globals.css'
import BootstrapClient from '@/app/BootstrapClient'
import { Flip, Slide, ToastContainer } from 'react-toastify'

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <BootstrapClient />
                { children }
                <ToastContainer
                    position="top-right"
                    autoClose={2000}
                    limit={5}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    draggable
                    pauseOnHover={false}
                    theme="colored"
                    transition={Flip}
                />
            </body>
        </html>
    );
}
