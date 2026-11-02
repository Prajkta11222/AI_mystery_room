import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, LoaderCircle, Trash2 } from 'lucide-react';
import Brand from '../components/Brand.jsx';
import { api } from '../services/api.js';
import { LanguagePicker, languages, localizedError, useLocale } from '../i18n.jsx';

export default function Library() {
  const { locale, t } = useLocale();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const result = await api.list(); setCases(result.investigations); }
    catch (err) { setError(localizedError(err, t)); }
    finally { setLoading(false); }
  }, [t]);
  useEffect(() => { load(); }, [load]);
  const remove = async (item) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    setDeleting(item.id); setError('');
    try { await api.delete(item.id); setCases((current) => current.filter((entry) => entry.id !== item.id)); }
    catch (err) { setError(localizedError(err, t)); }
    finally { setDeleting(''); }
  };
  const dateLocale = locale === 'hi' ? 'hi-IN' : 'en-IN';
  return <main className="create-page"><header className="topbar"><Brand/><div className="create-nav"><LanguagePicker/><Link to="/" className="back-link"><ArrowLeft size={15}/> {t('backHome')}</Link></div></header>
    <section className="case-library"><div className="library-heading"><div><div className="section-label">{t('caseFiles').toUpperCase()}</div><h1>{t('library')}</h1><p>{t('expires')}</p></div><Link to="/create" className="button button-primary">{t('create')} <ArrowRight size={15}/></Link></div>
      {error&&<div className="form-error" role="alert">{error}<button className="retry-save" onClick={load}>{t('retry')}</button></div>}
      {loading?<div className="library-empty"><LoaderCircle className="spin"/> {t('loading')}</div>:error?null:cases.length===0?<div className="library-empty"><p style={{margin:'0 0 14px'}}>{t('noCases')}</p><Link className="button button-primary" to="/create">{t('create')} <ArrowRight size={15}/></Link></div>:<div className="library-grid">{cases.map((item)=><article className="library-card" key={item.id}><div className="library-meta"><span className={`status-badge ${item.status==='completed'?'status-badge-complete':'status-badge-active'}`}>{item.status==='completed' ? <Check size={10}/> : <span className="live-dot" style={{height:'6px',width:'6px'}}/>}{t(item.status)}</span><span>{t(item.difficulty.toLowerCase())}</span><span>{languages.find((language)=>language.code===item.language)?.label||'English'}</span></div><h2>{item.title}</h2><p>{item.brief}</p><small>{new Intl.DateTimeFormat(dateLocale,{dateStyle:'medium'}).format(new Date(item.createdAt))}</small><div className="library-actions"><Link className="button button-primary" to={`/case/${item.id}`}>{item.status==='completed'?t('viewResults'):t('continue')} <ArrowRight size={14}/></Link><button className="button button-danger" disabled={deleting===item.id} onClick={()=>remove(item)} aria-label={`${t('delete')}: ${item.title}`}>{deleting===item.id?<LoaderCircle className="spin" size={14}/>:<><Trash2 size={14}/>{t('delete')}</>}</button></div></article>)}</div>}
    </section><footer className="create-footer"><span>CASE.FILE / {t('privateInvestigations').toUpperCase()}</span><span>{t('fictionalOnly').toUpperCase()}</span></footer>
  </main>;
}
