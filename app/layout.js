import 'bootstrap/dist/css/bootstrap.min.css'
import './globals.css'
import BootstrapClient from '@/app/BootstrapClient'
import { Flip, ToastContainer } from 'react-toastify'
import { GoogleOAuthProvider } from '@react-oauth/google'

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
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
                </GoogleOAuthProvider>
            </body>
        </html>
    );
}
