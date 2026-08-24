// V3 landing entry: static shell lives in index.html (SEO/no-JS); this module
// initializes theme and renders the data-driven discovery sections.
import { initTheme } from '@theme';
import './styles/main.css';
import { mountLanding } from './landing/landing';

initTheme();
mountLanding();
