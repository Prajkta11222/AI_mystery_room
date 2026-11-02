import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import CreateCase from './pages/CreateCase.jsx';
import CaseRoom from './pages/CaseRoom.jsx';
import NotFound from './pages/NotFound.jsx';
import Library from './pages/Library.jsx';
import Preferences from './pages/Preferences.jsx';
export default function App() { return <Routes><Route path="/" element={<Landing />} /><Route path="/create" element={<CreateCase />} /><Route path="/library" element={<Library />} /><Route path="/preferences" element={<Preferences />} /><Route path="/case/:caseId" element={<CaseRoom />} /><Route path="*" element={<NotFound />} /></Routes>; }
