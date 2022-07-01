import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Content, Home } from './pages';
import './App.css';
import Paperbase from './template/PaperBase';

function App() {
  const routes = (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/home' element={<Home />} />
      <Route path='/resource' element={<Home />} />
      <Route path='/weapon' element={<Home />} />
      <Route path='/calculator' element={<Home />} />
      <Route path='/content' element={<Content />} />
    </Routes>
  );
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <Paperbase>{routes}</Paperbase>
    </BrowserRouter>
  );
}

export default App;
