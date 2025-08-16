import ReactDOM from 'react-dom/client';
import './index.css';
import { AppWrapper } from './AppWrapper';

const rootElement = document.getElementById('root');

if (!rootElement) throw new Error('Failed to find the root element'); // Type guard

const root = ReactDOM.createRoot(rootElement);

root.render(
  <AppWrapper />
);
