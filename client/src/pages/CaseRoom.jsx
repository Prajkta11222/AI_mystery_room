import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, FileText, Fingerprint, FolderOpen, Image as ImageIcon, LoaderCircle, MessageSquareText, NotebookPen, Settings2, Shield, Video, X } from 'lucide-react';
import Brand from '../components/Brand.jsx';
import { PlainText } from '../components/PlainText.js';
import { api } from '../services/api.js';
import { LanguagePicker, localizedError, useLocale } from '../i18n.jsx';

const evidenceIcons = { message: MessageSquareText, statement: FileText, document: FileText, image: ImageIcon, cctv: Video };
const evidenceTypeKeys = { message: 'evidenceMessage', statement: 'evidenceStatement', document: 'evidenceDocument', image: 'evidenceImage', cctv: 'evidenceCctv', log: 'evidenceLog' };
const tabs = ['case', 'suspects', 'evidence', 'notes', 'hints'];
function formatCaseDateTime(value, locale) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
export default function CaseRoom() {
  const { caseId } = useParams();
  const location = useLocation();
  const { locale, t } = useLocale();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [activeEvidence, setActiveEvidence] = useState(null);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [hintBusy, setHintBusy] = useState(false);
  const [hint, setHint] = useState(null);
  const [hintError, setHintError] = useState('');
  const [saveState, setSaveState] = useState('saved');
  const [confirm, setConfirm] = useState(false);
  const [tutorial, setTutorial] = useState(false);
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [view, setView] = useState('case');
  const dialogRef = useRef(null);
  const evidence = useMemo(() => data?.evidence || [], [data]);
  const load = useCallback(async () => {
    try {
      const result = await api.get(caseId, locale);
      setData(result.case);
      setSelected(result.case.reveal?.selectedSuspectId || '');
      let hasSeen = false;
      try { hasSeen = localStorage.getItem('mystery-tutorial-complete') === 'yes'; } catch {}
      if (!hasSeen && !result.case.submitted) { setTutorial(true); setTutorialVisible(true); }
      const levels = result.case.requestedHintLevels || [];
      if (levels.length) {
        try { const previous = await api.hint(caseId, Math.max(...levels), locale); setHint(previous.hint); } catch { setHintError(t('retry')); }
      }
    } catch (err) { setError(localizedError(err, t)); }
  }, [caseId, locale, t]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!activeEvidence && !confirm) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    dialog.querySelector('button:not([disabled])')?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { setActiveEvidence(null); setConfirm(false); return; }
      if (event.key !== 'Tab') return;
      const focusable = [...dialog.querySelectorAll('button:not([disabled]),a[href],textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) { event.preventDefault(); return; }
      const first = focusable[0]; const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); if (previousFocus?.isConnected) previousFocus.focus(); };
  }, [activeEvidence, confirm]);

  const saveProgress = useCallback(async () => {
    if (!data || data.submitted) return;
    setSaveState('saving');
    try { await api.progress(caseId, { notes: data.notes, reviewedEvidence: data.reviewedEvidence }); setSaveState('saved'); }
    catch { setSaveState('error'); }
  }, [caseId, data]);
  useEffect(() => {
    if (!data || data.submitted) return undefined;
    setSaveState('saving');
    const timer = setTimeout(saveProgress, 500);
    return () => clearTimeout(timer);
  }, [data?.notes, data?.reviewedEvidence, caseId, data?.submitted, saveProgress]);

  const patch = (transform) => setData((current) => current ? transform(current) : current);
  const markReviewed = async (id) => {
    const reviewedEvidence = data.reviewedEvidence.includes(id) ? data.reviewedEvidence : [...data.reviewedEvidence, id];
    patch((current) => ({ ...current, reviewedEvidence }));
    try { await api.progress(caseId, { reviewedEvidence }); }
    catch { setError(t('saveFailed')); }
  };
  const requestHint = async () => {
    const level = Math.max(0, ...(data.requestedHintLevels || [])) + 1;
    if (level > 3) return;
    setHintBusy(true); setHintError('');
    try {
      const result = await api.hint(caseId, level, locale);
      setHint(result.hint);
      patch((current) => ({ ...current, requestedHintLevels: result.requestedHintLevels }));
    } catch (err) { setHintError(localizedError(err, t)); }
    finally { setHintBusy(false); }
  };
  const submit = async () => {
    setBusy(true);
    try {
      const { result } = await api.accuse(caseId, selected, locale);
      setData((current) => ({ ...current, submitted: true, status: 'completed', reveal: result }));
      setConfirm(false);
    } catch (err) { setError(localizedError(err, t)); }
    finally { setBusy(false); }
  };
  const dismissTutorial = () => { setTutorialVisible(false); setTutorial(false); try { localStorage.setItem('mystery-tutorial-complete', 'yes'); } catch {} };
  const dateLocale = locale === 'hi' ? 'hi-IN' : 'en-IN';
  const tabLabel = (tab) => t(tab);

  if (error && !data) return <main className="center-state"><Brand/><div className="state-card"><h1>{t('unavailable')}</h1><p>{error}</p><button className="button button-outline" onClick={() => { setError(''); load(); }}>{t('tryAgain')}</button><Link className="button button-primary" to="/create">{t('newCase')} <ArrowRight size={16}/></Link></div></main>;
  if (!data) return <main className="center-state"><LoaderCircle className="spin"/><p>{location.state?.loading ? t('building') : t('loading')}</p></main>;

  return <main className="room-page">
    <header className="room-top"><Brand/><div className="room-case-title"><span>{data.submitted ? t('closed').toUpperCase() : t('investigating').toUpperCase()}</span><b>{data.title}</b><span className="difficulty-pill">{data.difficulty}</span></div><div className="room-top-right"><LanguagePicker/><Link to="/preferences" className="exit-link" aria-label={t('preferences')}><Settings2 size={15}/><span>{t('preferences')}</span></Link><Link to="/library" className="exit-link" aria-label={t('library')}><FolderOpen className="mobile-room-icon" size={15}/><span>{t('library')}</span></Link><Link to="/" className="exit-link" aria-label={t('backHome')}><ArrowLeft size={15}/> <span>{t('backHome')}</span></Link></div></header>
    <div className="room-wrap"><div className="room-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> {t('caseFile').toUpperCase()} / {data.id.slice(-6).toUpperCase()}</div><h1>{data.title}</h1><p>{data.brief}</p></div><span className="fiction-stamp"><Shield size={14}/> {t('fictional')}</span></div>
      {data.reveal?.translationFallback&&<div className="form-error" role="status">{t('translationFallback')}</div>}
      {data.reveal&&<Reveal reveal={data.reveal} evidence={evidence} correct={data.reveal.isCorrect} hintCount={data.requestedHintLevels?.length||0} t={t} onReviewEvidence={()=>setView('evidence')}/>}
      <div className="case-meta-grid"><div><span>{t('scene').toUpperCase()}</span><b>{data.incident}</b></div><div><span>{t('location').toUpperCase()}</span><b>{data.location}</b></div><div><span>{t('dateTime').toUpperCase()}</span><b>{formatCaseDateTime(data.dateTime, locale)||t('timeNotRecorded')}</b></div><div><span>{t('objective').toUpperCase()}</span><b>{data.objective}</b></div></div>
      <nav className="investigation-tabs" role="tablist" aria-label={t('case')}>
        {tabs.map((tab) => <button key={tab} id={`tab-${tab}`} data-tab={tab} type="button" role="tab" aria-controls="investigation-tabpanel" aria-selected={view===tab} tabIndex={view===tab?0:-1} className={view===tab?'selected':''} onKeyDown={(event)=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;event.preventDefault();const index=tabs.indexOf(view);const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;setView(tabs[next]);event.currentTarget.parentElement.querySelector(`[data-tab="${tabs[next]}"]`)?.focus();}} onClick={()=>setView(tab)}>{tabLabel(tab)}{tab==='evidence'&&<small>{data.reviewedEvidence.length}/{evidence.length}</small>}</button>)}
      </nav>
      <section id="investigation-tabpanel" className="room-panel investigation-panel" role="tabpanel" aria-labelledby={`tab-${view}`}>
        {view==='case'&&<><div className="panel-heading"><div><span className="section-label">{t('case').toUpperCase()}</span><h2>{t('timeline')}</h2></div><Clock3 size={19}/></div>{data.brief && <p className="case-overview-description">{data.brief}</p>}<div className="timeline-list">{data.timeline?.length ? data.timeline.map((item,index)=><div className="timeline-item" key={`${item.time}-${index}`}><span>{formatCaseDateTime(item.time, locale)||t('timeNotRecorded')}</span><i/><p>{item.event}</p></div>) : <p className="empty-state">{t('noTimeline')}</p>}</div><div className="case-quick-actions"><button className="button button-primary" onClick={()=>setView('evidence')}>{t('evidence')} <ArrowRight size={15}/></button><button className="button button-outline" onClick={()=>{setTutorial(true);setTutorialVisible(true);}}>{t('help')}</button></div></>}
        {view==='suspects'&&<><div className="panel-heading"><div><span className="section-label">{t('persons').toUpperCase()}</span><h2>{t('suspects')} <small>{data.suspects.length.toString().padStart(2,'0')}</small></h2></div><Fingerprint size={19}/></div>{data.suspects.length ? <div className="suspect-list">{data.suspects.map((suspect,index)=><button key={suspect.id} className={`suspect-card ${selected===suspect.id?'suspect-selected':''} ${data.submitted?'suspect-locked':''}`} onClick={()=>!data.submitted&&setSelected(suspect.id)} aria-pressed={selected===suspect.id}><span className="suspect-num">{String(index+1).padStart(2,'0')}</span><span className="suspect-copy"><b>{suspect.name}</b><small>{suspect.role}</small><span>{suspect.relationship}</span><span className="suspect-alibi">{suspect.alibi}</span></span><span className="suspect-select">{selected===suspect.id?<Check size={15}/>:<span/>}</span></button>)}</div> : <p className="empty-state">{t('noSuspects')}</p>}{!data.submitted&&data.suspects.length>0&&<div className="accuse-box"><div className="section-label">{t('accusation').toUpperCase()}</div><p>{t('finalWarning')}</p><button className="button button-dark" disabled={!selected} onClick={()=>setConfirm(true)}>{t('accusation')} <ArrowRight size={16}/></button></div>}</>}
        {view==='evidence'&&<><div className="panel-heading"><div><span className="section-label">{t('locker').toUpperCase()}</span><h2>{t('evidence')} <small>{data.reviewedEvidence.length}/{evidence.length} {t('reviewed')}</small></h2></div><FileText size={19}/></div><div className="evidence-list" id="evidence-locker">{evidence.length ? evidence.map((item,index)=>{const Icon=evidenceIcons[item.type]||FileText;return <button className="evidence-card" key={item.id} onClick={()=>setActiveEvidence(item)}><span className="evidence-index">{String(index+1).padStart(2,'0')}</span><span className="evidence-icon"><Icon size={17}/></span><span className="evidence-copy"><b>{item.title}</b><small>{item.type==='cctv'?t('simulated'):item.type==='image'?t('fictionalMedia'):t(evidenceTypeKeys[item.type]||'evidenceOther').toUpperCase()} · {item.source}</small></span>{data.reviewedEvidence.includes(item.id)?<span className="reviewed-mark"><Check size={13}/></span>:<ArrowRight size={15} className="evidence-arrow"/>}</button>;}) : <p className="empty-state">{t('noEvidence')}</p>}</div>{evidence.length>0&&<><div className="evidence-progress-bar"><div className="evidence-progress-fill" style={{width: evidence.length ? `${(data.reviewedEvidence.length/evidence.length)*100}%` : '0%'}}/></div><div className="evidence-foot"><Shield size={14}/> {t('fictional')}</div></>}</>}
        {view==='notes'&&<><div className="panel-heading"><div><span className="section-label">{t('notes').toUpperCase()}</span><h2>{t('notes')}</h2></div><NotebookPen size={19}/></div><p className="notes-help">{t('privateNotes')}</p><textarea value={data.notes||''} maxLength={5000} disabled={data.submitted} onChange={(event)=>patch((current)=>({...current,notes:event.target.value}))} placeholder={t('privateNotes')}/><div className="notes-status" aria-live="polite"><span>{saveState==='saved'?t('saved'):saveState==='saving'?t('saving'):<>{t('saveFailed')} · <button className="retry-save" onClick={saveProgress}>{t('retry')}</button></>}</span><span>{(data.notes||'').length}/5000</span></div></>}
        {view==='hints'&&<><div className="panel-heading"><div><span className="section-label">{t('hints').toUpperCase()}</span><h2>{t('hints')}</h2></div><CheckCircle2 size={19}/></div><div className="hint-dots" style={{marginTop: '12px', marginBottom: '4px'}}>{[1,2,3].map(n => (<span key={n} className={`hint-dot ${(data.requestedHintLevels?.length||0)>=n?'used':''}`}/>))}<span style={{fontSize:'9px',color:'#95948a',marginLeft:'5px',fontFamily:'var(--mono)'}}>{data.requestedHintLevels?.length||0}/3</span></div><p className="notes-help">{t('tutorialBody')}</p>{hint&&<div className="hint-box" aria-live="polite"><span className="hint-level">{t(hint.level===1?'hintNudge':hint.level===2?'hintConnection':'hintStrong')} · {hint.level}/3</span><p>{hint.text}</p></div>}{hintError&&<div className="form-error" role="alert">{hintError}</div>}<div className="hint-actions"><button className="button button-primary" disabled={hintBusy||data.submitted||(data.requestedHintLevels?.length||0)>=3} onClick={requestHint}>{hintBusy?<LoaderCircle className="spin" size={15}/>:t('requestHint')}</button><span>{data.requestedHintLevels?.length||0}/3 · {t('hintsUsed')}</span></div>{(data.requestedHintLevels?.length||0)>=3&&<p className="notes-help">{t('hintLimit')}</p>}</>}
      </section>
      <div className="room-accusation-bar">
  {data.submitted
    ? <p className="locked-copy"><CheckCircle2 size={15}/> {t('closed')}</p>
    : <>
        <span>
          {selected
            ? <><span style={{display:'block'}}>{t('finalWarning')}</span><span className="accuse-selected-name">{data.suspects.find(s=>s.id===selected)?.name}</span></>
            : t('finalWarning')
          }
        </span>
        <button className="button button-dark" disabled={!selected} onClick={()=>setConfirm(true)}>{t('accusation')} <ArrowRight size={15}/></button>
      </>
  }
</div>
      <footer className="room-footer"><Brand/><span>{t('caseFile').toUpperCase()} / {data.status==='completed'?t('completed').toUpperCase():t('investigating').toUpperCase()}</span><Link to="/library">{t('library')} <ArrowRight size={14}/></Link></footer>
    </div>
    {activeEvidence&&<div className="modal-backdrop" onMouseDown={(event)=>event.target===event.currentTarget&&setActiveEvidence(null)}><article ref={dialogRef} className="evidence-modal" role="dialog" aria-modal="true" aria-labelledby="evidence-dialog-title"><button className="modal-close" aria-label={t('close')} onClick={()=>setActiveEvidence(null)}><X size={19}/></button><div className="section-label">{t('evidence')} / {t(evidenceTypeKeys[activeEvidence.type]||'evidenceOther').toUpperCase()}</div><h2 id="evidence-dialog-title">{activeEvidence.title}</h2><div className="evidence-modal-meta"><span>{formatCaseDateTime(activeEvidence.timestamp, locale)||t('timeNotRecorded')}</span><span>{activeEvidence.source}</span></div><PlainText as="p" className="evidence-description" value={activeEvidence.description}/>{activeEvidence.type==='image'||activeEvidence.type==='cctv'?<div className="fictional-media"><ImageIcon size={28}/><span>{activeEvidence.type==='cctv'?t('simulated'):t('fictionalMedia')}</span><PlainText as="p" value={activeEvidence.content}/></div>:<PlainText as="div" className="evidence-content" value={activeEvidence.content}/>}<div className="modal-bottom"><span><Shield size={14}/> {t('fictional')}</span><button className="button button-primary" disabled={data.submitted||data.reviewedEvidence.includes(activeEvidence.id)} onClick={()=>{markReviewed(activeEvidence.id);setActiveEvidence(null);}}>{data.reviewedEvidence.includes(activeEvidence.id)?t('saved'):t('reviewed')} <Check size={15}/></button></div></article></div>}
    {confirm&&<div className="modal-backdrop"><div ref={dialogRef} className="confirm-card" role="dialog" aria-modal="true" aria-labelledby="accusation-dialog-title" aria-describedby="accusation-dialog-description"><button className="modal-close" aria-label={t('close')} onClick={()=>setConfirm(false)}><X size={19}/></button><span className="confirm-icon"><Fingerprint size={25}/></span><div className="section-label">{t('accusation').toUpperCase()}</div><h2 id="accusation-dialog-title">{t('accusation')}</h2><p id="accusation-dialog-description">{t('finalWarning')} <b>{data.suspects.find((suspect)=>suspect.id===selected)?.name}</b></p><div className="confirm-actions"><button className="button button-outline" onClick={()=>setConfirm(false)}>{t('keepInvestigating')}</button><button className="button button-primary" disabled={busy} onClick={submit}>{busy?<LoaderCircle className="spin" size={16}/>:<>{t('confirm')} <ArrowRight size={15}/></>}</button></div></div></div>}
    {tutorialVisible&&tutorial&&<aside className="tutorial-card" aria-labelledby="tutorial-title"><button className="modal-close" aria-label={t('close')} onClick={dismissTutorial}><X size={18}/></button><h2 id="tutorial-title">{t('tutorialTitle')}</h2><p>{t('tutorialBody')}</p><div className="tutorial-actions"><button className="button button-outline" onClick={dismissTutorial}>{t('skip')}</button><button className="button button-primary" onClick={dismissTutorial}>{t('tutorialStart')}</button></div></aside>}
    {error&&data&&<div className="toast-error" role="alert">{error}<button aria-label={t('close')} onClick={()=>setError('')}><X size={14}/></button></div>}
  </main>;
}

function Reveal({ reveal, evidence, correct, hintCount, t, onReviewEvidence }) {
  return <section className={`reveal-banner ${correct?'reveal-correct':'reveal-missed'}`}><div className="reveal-result"><span className="section-label">{t('closed').toUpperCase()}</span><div className="reveal-verdict"><span className="reveal-verdict-icon">{correct ? <Check size={16}/> : <X size={16}/>}</span><h2 style={{margin:0}}>{correct?t('correct'):t('incorrect')}</h2></div><p>{correct?t('correct'):t('incorrect')} · {t('culprit')} <b>{reveal.culprit.name}</b>.</p><small>{t('hintsUsed')}: {hintCount}</small></div><div className="reveal-details"><div><span>{t('motive').toUpperCase()}</span><p>{reveal.motive}</p></div><div><span>{t('method').toUpperCase()}</span><p>{reveal.method}</p></div><div><span>{t('solution').toUpperCase()}</span><p>{reveal.fullExplanation}</p></div></div><div className="reasoning-list"><b>{t('clueLinks').toUpperCase()}</b>{reveal.evidenceReasoning.map((reason,index)=>{const item=evidence.find((entry)=>entry.id===reason.evidenceId);return <p key={`${reason.evidenceId}-${index}`}><i>{item?.title || reason.evidenceId}</i><span className="reasoning-implication">{reason.implication==='supports_culprit'?t('clueSupports'):reason.implication==='red_herring'?t('clueMisleads'):t('clueWeakens')}</span>{reason.explanation}</p>;})}</div><div className="reveal-actions"><button className="button button-outline" onClick={onReviewEvidence}>{t('evidence')}</button><Link className="button button-primary" to="/library">{t('library')} <ArrowRight size={15}/></Link></div></section>;
}
