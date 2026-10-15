import {StrictMode} from 'react';
import ReactDOM from 'react-dom/client';
import Hero from './components/hero/hero';
import NavDark from './components/nav/nav';
import SignupForm from './components/forms/signup/signup';


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StrictMode>
      <NavDark />
      <Hero />
      <SignupForm />
  </StrictMode>
);
