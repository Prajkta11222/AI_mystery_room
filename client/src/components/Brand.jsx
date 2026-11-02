import { Link } from 'react-router-dom';
import { Fingerprint } from 'lucide-react';
export default function Brand({ light = false }) { return <Link to="/" className={`brand ${light ? 'brand-light' : ''}`}><span className="brand-icon"><Fingerprint size={19} /></span><span>CASE<span className="brand-dot">.</span>FILE</span></Link>; }
