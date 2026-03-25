import { toast } from 'react-toastify'

export const getTostify = (type, text = '') => {
    switch (type) {
        case 'success':
            return toast.success(text || 'Success!');
        case 'error':
            return toast.error(text || 'Something went wrong!');
        case 'warning':
            return toast.warning(text || 'Warning!');
        case 'info':
            return toast.info(text || 'Info!');
        default:
            return toast(text || 'Notification');
    }
}