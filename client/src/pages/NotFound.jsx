import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Brand from '../components/Brand.jsx';
import { useLocale } from '../i18n.jsx';

export default function NotFound() {
  const { t } = useLocale();
  return <main className="center-state"><Brand/><div className="state-card"><span className="section-label">404 / {t('caseFile').toUpperCase()}</span><h1>{t('notFoundTitle')}</h1><p>{t('notFoundBody')}</p><Link className="button button-primary" to="/"><ArrowLeft size={15}/> {t('backToArchive')}</Link></div></main>;
}
