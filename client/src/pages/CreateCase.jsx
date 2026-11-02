import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, LoaderCircle, ShieldCheck, Shuffle } from 'lucide-react';
import Brand from '../components/Brand.jsx';
import { api } from '../services/api.js';
import { LanguagePicker, localizedError, useLocale } from '../i18n.jsx';

const MAX = 1000;
const categories = ['general', 'locked_room', 'art_theft', 'disappearance', 'historical', 'espionage'];
export default function CreateCase() {
  const [scenario, setScenario] = useState('');
  const [random, setRandom] = useState(false);
  const [category, setCategory] = useState('general');
  const [difficulty, setDifficulty] = useState('Medium');
  const [length, setLength] = useState('Short');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const idempotencyKey = useRef(null);
  const navigate = useNavigate();
  const { locale, t } = useLocale();
  useEffect(() => { idempotencyKey.current = null; }, [locale]);
  const submit = async (event) => {
    event.preventDefault();
    const value = scenario.trim();
    if (!random && value.length < 30) { setError(t('noPremise')); return; }
    if (!random && value.length > MAX) { setError(t('tooLong')); return; }
    setError(''); setLoading(true);
    try {
      const body = { random, category, difficulty, length, language: locale, ...(random ? {} : { scenario: value }) };
      idempotencyKey.current ||= crypto.randomUUID();
      const { case: created } = await api.create(body, idempotencyKey.current);
      idempotencyKey.current = null;
      navigate(`/case/${created.id}`, { state: { loading: true } });
    } catch (err) { setError(localizedError(err, t)); setLoading(false); }
  };
  const update = (setter, value) => { idempotencyKey.current = null; setter(value); };
  return <main className="create-page">
    <header className="topbar"><Brand/><div className="create-nav"><LanguagePicker/><Link to="/" className="back-link"><ArrowLeft size={15}/> {t('backHome')}</Link></div></header>
    <div className="create-shell"><aside className="create-aside"><div className="eyebrow"><span className="eyebrow-line"/> {t('newInvestigation').toUpperCase()}</div><h1>{t('createTitle')}</h1><p>{t('intro')}</p><div className="aside-note"><BookOpen size={17}/><span><b>{t('fictional')}</b><br/>{t('sensitive')}</span></div><div className="aside-index">{t('caseFile').toUpperCase()} / <span>{t('intake').toUpperCase()}</span></div></aside>
      <section className="form-card"><div className="form-heading"><div><div className="section-label">{t('caseIntake').toUpperCase()}</div><h2>{t('create')}</h2></div><span className="form-step">01 <i>/ 01</i></span></div>
        <form onSubmit={submit}>
          <fieldset className="choice-group"><legend className="field-label">{t('custom').toUpperCase()} / {t('random').toUpperCase()}</legend><div className="choice-row"><button type="button" className={`choice ${!random?'selected':''}`} onClick={()=>{update(setRandom,false);}} aria-pressed={!random}><b>{t('custom')}</b><small>{t('premiseHelp')}</small></button><button type="button" className={`choice ${random?'selected':''}`} onClick={()=>{update(setRandom,true);}} aria-pressed={random}><b><Shuffle size={14}/> {t('random')}</b><small>{t('category')}</small></button></div></fieldset>
          {!random&&<><label className="field-label" htmlFor="scenario">{t('premise')} <span>{t('required').toUpperCase()}</span></label><textarea id="scenario" maxLength={MAX} value={scenario} onChange={(event)=>{update(setScenario,event.target.value);if(error)setError('');}} placeholder={t('premiseShort')} rows="5" aria-describedby="scenario-help"/><div className="field-foot" id="scenario-help"><span>{t('premiseHelp')}</span><span className={scenario.length>MAX-80?'count-warn':''}>{scenario.length} / {MAX}</span></div><p className="privacy-inline">{t('sensitive')}</p></>}
          <div className="choice-group"><label className="field-label" htmlFor="category">{t('category')}</label><select id="category" className="select-control" value={category} onChange={(event)=>update(setCategory,event.target.value)}>{categories.map((value)=><option key={value} value={value}>{t(value)}</option>)}</select></div>
          <div className="choice-group"><span className="field-label">{t('difficulty')}</span><div className="choice-row">{['Easy','Medium','Hard'].map((value)=><button type="button" key={value} className={`choice ${difficulty===value?'selected':''}`} onClick={()=>update(setDifficulty,value)} aria-pressed={difficulty===value}><b>{t(value.toLowerCase())}</b><small>{value==='Easy'?t('clearTrail'):value==='Medium'?t('connectClues'):t('everyDetail')}</small></button>)}</div></div>
          <div className="choice-group length-group"><span className="field-label">{t('length')}</span><div className="choice-row">{['Short','Medium','Long'].map((value)=><button type="button" key={value} className={`choice ${length===value?'selected':''}`} onClick={()=>update(setLength,value)} aria-pressed={length===value}><b>{t(value.toLowerCase())}</b><small>{value==='Short'?t('focused'):value==='Medium'?t('mediumDetail'):t('deeper')}</small></button>)}</div></div>
          {error&&<div className="form-error" role="alert">{error}</div>}
          <button className="button button-primary generate-button" disabled={loading}>{loading?<><LoaderCircle className="spin" size={17}/> {t('building')}</>:<>{t('generate')} <ArrowRight size={17}/></>}</button><div className="privacy-note"><ShieldCheck size={15}/> {t('sensitive')}</div>
        </form>
      </section></div><footer className="create-footer"><span>CASE.FILE / {t('caseIntake').toUpperCase()}</span><span>{t('fictional').toUpperCase()}</span></footer>
  </main>;
}
