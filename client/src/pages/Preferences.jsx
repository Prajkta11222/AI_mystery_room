import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Check, Languages } from 'lucide-react';
import Brand from '../components/Brand.jsx';
import { LanguagePicker, useLocale } from '../i18n.jsx';

export default function Preferences() {
  const { t } = useLocale();
  const [notice, setNotice] = useState('');
  const resetWalkthrough = () => {
    try { localStorage.removeItem('mystery-tutorial-complete'); } catch {}
    setNotice(t('preferenceSaved'));
  };
  return <main className="create-page"><header className="topbar"><Brand/><Link to="/" className="back-link"><ArrowLeft size={15}/> {t('backHome')}</Link></header>
    <section className="case-library preferences-page"><div className="library-heading"><div><div className="section-label">CASE.FILE / {t('preferences').toUpperCase()}</div><h1>{t('preferences')}</h1></div><Link className="button button-outline" to="/library">{t('library')}</Link></div>
      <section className="room-panel preference-card"><div className="panel-heading"><div><span className="section-label"><Languages size={14}/> {t('language').toUpperCase()}</span><h2>{t('languageSettingTitle')}</h2></div><LanguagePicker onChanged={() => setNotice(t('preferenceSaved'))}/></div><p>{t('languageSettingBody')}</p></section>
      <section className="room-panel preference-card"><div className="panel-heading"><div><span className="section-label"><BookOpen size={14}/> {t('help').toUpperCase()}</span><h2>{t('walkthroughTitle')}</h2></div></div><p>{t('walkthroughBody')}</p><button className="button button-primary" onClick={resetWalkthrough}>{t('restartWalkthrough')}</button></section>
      {notice&&<p className="preference-notice" role="status"><Check size={13}/> {notice}</p>}
      <p className="preference-retention">{t('expires')}</p>
    </section><footer className="create-footer"><span>CASE.FILE / {t('preferences').toUpperCase()}</span><span>{t('fictionalOnly').toUpperCase()}</span></footer>
  </main>;
}
