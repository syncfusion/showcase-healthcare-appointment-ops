import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles.css';
import { initTheme } from './theme/ThemeProvider';
import { registerLicense, setCulture, setCurrencyCode } from '@syncfusion/ej2-base'

const licenseKey = import.meta.env.VITE_SYNCFUSION_LICENSE_KEY as string | undefined;
if (licenseKey) {
  registerLicense(licenseKey);
}

setCulture('en-US')
setCurrencyCode('USD')

import '@syncfusion/ej2-base/styles/tailwind3.css';
import '@syncfusion/ej2-buttons/styles/tailwind3.css';
import '@syncfusion/ej2-calendars/styles/tailwind3.css';
import '@syncfusion/ej2-dropdowns/styles/tailwind3.css';
import '@syncfusion/ej2-grids/styles/tailwind3.css';
import '@syncfusion/ej2-inputs/styles/tailwind3.css';
import '@syncfusion/ej2-kanban/styles/tailwind3.css';
import '@syncfusion/ej2-layouts/styles/tailwind3.css';
import '@syncfusion/ej2-lists/styles/tailwind3.css';
import '@syncfusion/ej2-navigations/styles/tailwind3.css';
import '@syncfusion/ej2-pdfviewer/styles/tailwind3.css';
import '@syncfusion/ej2-notifications/styles/tailwind3.css';
import '@syncfusion/ej2-popups/styles/tailwind3.css';
import '@syncfusion/ej2-schedule/styles/tailwind3.css';
import '@syncfusion/ej2-interactive-chat/styles/tailwind3.css';
import '@syncfusion/ej2-splitbuttons/styles/tailwind3.css';
import '@syncfusion/ej2-dropdowns/styles/tailwind3.css';
import '@syncfusion/ej2-react-documenteditor/styles/tailwind3.css';

initTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
