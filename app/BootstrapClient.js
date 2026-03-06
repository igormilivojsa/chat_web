"use client"

import { useEffect } from 'react';

export default function BootstrapClient() {
    useEffect(() => {
        console.log(typeof window)
        console.log(typeof document)

        import("bootstrap/dist/js/bootstrap.bundle.min.js")
    }, [])
    return null;
}
