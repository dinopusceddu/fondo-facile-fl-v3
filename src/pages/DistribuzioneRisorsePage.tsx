// pages/DistribuzioneRisorsePage.tsx
import React, { useMemo, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext.tsx';
import { Card } from '../components/shared/Card.tsx';
import { TEXTS_UI, distribuzioneFieldDefinitions } from '../constants.ts';
import { DistribuzioneRisorseData } from '../types.ts';
import { FundingItem } from '../components/shared/FundingItem.tsx';
import { Button } from '../components/shared/Button.tsx';
import { Input } from '../components/shared/Input.tsx';
import { Checkbox } from '../components/shared/Checkbox.tsx';
import { calculateFadTotals } from '../logic/fundEngine.ts';

const formatCurrency = (value?: number, defaultText = TEXTS_UI.notApplicable) => {
  if (value === undefined || value === null || isNaN(value)) return defaultText;
  return `€ ${value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const DisplayField: React.FC<{ label: string; value: string | number; info?: string }> = ({ label, value, info }) => (
  <div className="mb-4">
    <label className="block text-base font-medium text-[#1b0e0e] pb-2">{label}</label>
    <div className="flex w-full min-w-0 flex-1 items-center rounded-lg text-[#1b0e0e] border border-[#d1c0c1] bg-[#fcf8f8] h-12 md:h-14 p-3 md:p-4 text-base font-semibold">
      {value}
    </div>
    {info && <p className="mt-1 text-xs text-[#5f5252]">{info}</p>}
  </div>
);

export const DistribuzioneRisorsePage: React.FC = () => {
  const { state, dispatch, saveState } = useAppContext();
  const { fundData, calculatedFund } = state;
  const { dettagli: employees } = state.personaleServizio;

  if (!calculatedFund || !calculatedFund.dettaglioFondi) {
    return (
      <div className="space-y-8">
        <h2 className="text-[#1b0e0e] tracking-light text-2xl sm:text-[30px] font-bold leading-tight">Distribuzione delle Risorse</h2>
        <Card title="Dati non disponibili">
          <p className="text-lg text-[#5f5252] mb-4">
            Per poter distribuire le risorse, è necessario prima eseguire il calcolo generale del fondo.
          </p>
          <p className="text-sm text-[#5f5252] mb-4">
            Vai alla pagina <strong className="text-[#1b0e0e]">"Dati Costituzione Fondo"</strong> e clicca sul pulsante <strong className="text-[#ea2832]">"Salva Dati e Calcola Fondo"</strong>.
          </p>
          <Button 
            variant="primary" 
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'dataEntry' })}
          >
            Vai a Dati Costituzione Fondo
          </Button>
        </Card>
      </div>
    );
  }

  const {
    distribuzioneRisorseData,
    fondoAccessorioDipendenteData,
    annualData,
    fondoElevateQualificazioniData,
  } = fundData;
  
  const { 
    simulatoreRisultati, 
    isEnteDissestato,
    isEnteStrutturalmenteDeficitario,
    isEnteRiequilibrioFinanziario,
  } = annualData;
  
  const isEnteInCondizioniSpeciali = !!isEnteDissestato || !!isEnteStrutturalmenteDeficitario || !!isEnteRiequilibrioFinanziario;
  const incrementoEQconRiduzioneDipendenti = fondoElevateQualificazioniData?.ris_incrementoConRiduzioneFondoDipendenti;

  const fadTotals = useMemo(() => calculateFadTotals(
    fondoAccessorioDipendenteData, 
    simulatoreRisultati, 
    isEnteInCondizioniSpeciali, 
    incrementoEQconRiduzioneDipendenti
  ), [fondoAccessorioDipendenteData, simulatoreRisultati, isEnteInCondizioniSpeciali, incrementoEQconRiduzioneDipendenti]);

  const totaleDaDistribuire = fadTotals.totaleRisorseDisponibiliContrattazione_Dipendenti;


  const handleChange = (field: keyof DistribuzioneRisorseData, value?: number | boolean) => {
    dispatch({ type: 'UPDATE_DISTRIBUZIONE_RISORSE_DATA', payload: { [field]: value } });
  };
  
  const { p_performanceIndividuale, p_performanceOrganizzativa } = distribuzioneRisorseData;

  useEffect(() => {
    const individuale = p_performanceIndividuale || 0;
    const organizzativa = p_performanceOrganizzativa || 0;
    const total = individuale + organizzativa;

    if (total > 0) {
        const newPerc = (individuale / total) * 100;
        if (distribuzioneRisorseData.criteri_percPerfIndividuale?.toFixed(1) !== newPerc.toFixed(1)) {
             dispatch({
                type: 'UPDATE_DISTRIBUZIONE_RISORSE_DATA',
                payload: { criteri_percPerfIndividuale: parseFloat(newPerc.toFixed(1)) }
            });
        }
    } else if (distribuzioneRisorseData.criteri_percPerfIndividuale !== 70) { // Reset to default if total is zero
        dispatch({
            type: 'UPDATE_DISTRIBUZIONE_RISORSE_DATA',
            payload: { criteri_percPerfIndividuale: 70 }
        });
    }
  }, [p_performanceIndividuale, p_performanceOrganizzativa, dispatch, distribuzioneRisorseData.criteri_percPerfIndividuale]);

  const handlePerfPercChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPercStr = e.target.value;
    const newPerc = newPercStr === '' ? undefined : parseFloat(newPercStr);
    
    dispatch({ type: 'UPDATE_DISTRIBUZIONE_RISORSE_DATA', payload: { criteri_percPerfIndividuale: newPerc }});

    if (newPerc !== undefined && newPerc >= 0 && newPerc <= 100) {
        const currentIndividuale = p_performanceIndividuale || 0;
        const currentOrganizzativa = p_performanceOrganizzativa || 0;
        const totalPerformanceBudget = currentIndividuale + currentOrganizzativa;

        if (totalPerformanceBudget > 0) {
            const newIndividuale = totalPerformanceBudget * (newPerc / 100);
            const newOrganizzativa = totalPerformanceBudget - newIndividuale;
            
            dispatch({ 
                type: 'UPDATE_DISTRIBUZIONE_RISORSE_DATA', 
                payload: { 
                    p_performanceIndividuale: parseFloat(newIndividuale.toFixed(2)),
                    p_performanceOrganizzativa: parseFloat(newOrganizzativa.toFixed(2))
                } 
            });
        }
    }
  };
  
  const utilizziParteStabile = useMemo(() => {
    const data = distribuzioneRisorseData || {};
    return (data.u_diffProgressioniStoriche || 0) +
           (data.u_indennitaComparto || 0) +
           (data.u_incrIndennitaEducatori || 0) +
           (data.u_incrIndennitaScolastico || 0) +
           (data.u_indennitaEx8QF || 0);
  }, [distribuzioneRisorseData]);
  
  const utilizziParteVariabile = useMemo(() => {
    const data = distribuzioneRisorseData || {};
    return Object.keys(data)
      .filter(key => key.startsWith('p_'))
      .reduce((sum, key) => {
          const value = data[key as keyof DistribuzioneRisorseData];
          if (typeof value === 'number') {
              return sum + value;
          }
          return sum;
      }, 0);
  }, [distribuzioneRisorseData]);

  const totaleAllocato = useMemo(() => {
    return utilizziParteStabile + utilizziParteVariabile;
  }, [utilizziParteStabile, utilizziParteVariabile]);

  const importoRimanente = totaleDaDistribuire - totaleAllocato;

  const importoDisponibileContrattazione = useMemo(() => {
    return totaleDaDistribuire - utilizziParteStabile;
  }, [totaleDaDistribuire, utilizziParteStabile]);

  const sections = useMemo(() => 
    distribuzioneFieldDefinitions.reduce((acc, field) => {
      (acc[field.section] = acc[field.section] || []).push(field);
      return acc;
    }, {} as Record<string, typeof distribuzioneFieldDefinitions>)
  , []);

  const numeroDipendenti = employees?.length || 0;
  const percDipendentiBonus = distribuzioneRisorseData.criteri_percDipendentiBonus || 0;
  const numDipendentiBonus = Math.ceil(numeroDipendenti * (percDipendentiBonus / 100));
  const maggiorazioneIndividualeTotale = distribuzioneRisorseData.p_maggiorazionePerformanceIndividuale || 0;
  const maggiorazioneProCapite = numDipendentiBonus > 0 ? maggiorazioneIndividualeTotale / numDipendentiBonus : 0;

  return (
    <div className="space-y-8 pb-24">
      <h2 className="text-[#1b0e0e] tracking-light text-2xl sm:text-[30px] font-bold leading-tight">Distribuzione delle Risorse del Fondo</h2>
      
      <Card title="Riepilogo Risorse e Allocazione" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[#fcf8f8] rounded-lg text-center">
            <h4 className="text-sm font-medium text-[#5f5252]">Totale da Distribuire</h4>
            <p className="text-2xl font-bold text-[#1b0e0e]">{formatCurrency(totaleDaDistribuire)}</p>
            <p className="text-xs text-[#5f5252] mt-1">(Dal Fondo Personale Dipendente)</p>
          </div>
          <div className="p-4 bg-sky-50 rounded-lg text-center border border-sky-200">
            <h4 className="text-sm font-medium text-sky-800">Importo disponibile alla contrattazione</h4>
            <p className="text-2xl font-bold text-sky-700">{formatCurrency(importoDisponibileContrattazione)}</p>
            <p className="text-xs text-sky-600 mt-1">(Totale da Distribuire - Utilizzi Parte Stabile)</p>
          </div>
          <div className="p-4 bg-[#fcf8f8] rounded-lg text-center">
            <h4 className="text-sm font-medium text-[#5f5252]">Totale Allocato</h4>
            <p className={`text-2xl font-bold ${importoRimanente < 0 ? 'text-[#c02128]' : 'text-green-600'}`}>
              {formatCurrency(totaleAllocato)}
            </p>
            <p className="text-xs text-[#5f5252] mt-1">(Somma di tutti gli utilizzi)</p>
          </div>
          <div className={`p-4 rounded-lg text-center transition-colors ${importoRimanente < 0 ? 'bg-[#fef2f2]' : 'bg-[#f0fdf4]'}`}>
            <h4 className="text-sm font-medium text-[#5f5252]">Importo Rimanente</h4>
            <p className={`text-2xl font-bold ${importoRimanente < 0 ? 'text-[#c02128]' : 'text-green-700'}`}>
              {formatCurrency(importoRimanente)}
            </p>
            <p className="text-xs text-[#5f5252] mt-1">(Totale da Distribuire - Totale Allocato)</p>
          </div>
        </div>
        {importoRimanente < 0 && (
          <p className="text-center text-sm text-red-600 font-semibold mt-3 p-2 bg-red-50 rounded-md">
            Attenzione: l'importo allocato supera le risorse disponibili.
          </p>
        )}
      </Card>

      <Card title="Criteri di distribuzione delle risorse" className="mb-6" isCollapsible defaultCollapsed={false}>
        <div className="border-b border-[#f3e7e8] pb-4 mb-4">
          <Checkbox
            id="isConsuntivoMode"
            label="Entrare nella modalità distribuzione delle risorse a consuntivo?"
            checked={!!distribuzioneRisorseData.criteri_isConsuntivoMode}
            onChange={(e) => handleChange('criteri_isConsuntivoMode', e.target.checked)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
            <Input 
                label="Percentuale performance individuale (%)"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={distribuzioneRisorseData.criteri_percPerfIndividuale ?? ''}
                onChange={handlePerfPercChange}
                inputInfo="Modifica questa percentuale per ripartire automaticamente gli importi totali di performance individuale e organizzativa inseriti sotto."
            />
            <DisplayField 
                label="Percentuale performance organizzativa (%)"
                value={`${(100 - (distribuzioneRisorseData.criteri_percPerfIndividuale || 0)).toFixed(1)}%`}
                info="Calcolato come 100% - % individuale"
            />
            <Input 
                label="% maggiorazione premio medio pro capite"
                type="number"
                min="20"
                max="100"
                step="1"
                value={distribuzioneRisorseData.criteri_percMaggiorazionePremio ?? ''}
                onChange={(e) => handleChange('criteri_percMaggiorazionePremio', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                inputInfo="Rif. Art. 81 c. 2 CCNL 2022. Min 20%, Max 100%."
            />
            <DisplayField
                label="Numero dipendenti totali"
                value={numeroDipendenti}
                info="Conteggio da 'Personale in servizio'"
            />
            <Input
                label="% dipendenti con bonus individuale"
                type="number"
                min="1"
                max="50"
                step="1"
                value={distribuzioneRisorseData.criteri_percDipendentiBonus ?? ''}
                onChange={(e) => handleChange('criteri_percDipendentiBonus', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                inputInfo="Percentuale di personale a cui attribuire la maggiorazione del premio. Min 1%, Max 50%."
            />
            <DisplayField
                label="Numero dipendenti con bonus"
                value={numDipendentiBonus}
                info="Calcolato come (% dipendenti bonus * N. dipendenti totali), arrotondato per eccesso."
            />
        </div>
        <div className="mt-4">
            <DisplayField
                label="Maggiorazione pro-capite premio individuale"
                value={formatCurrency(maggiorazioneProCapite)}
                info="Calcolato come (Importo 'Premi per la maggiorazione') / (Numero dipendenti con bonus)."
            />
        </div>
      </Card>
      
      {Object.entries(sections).map(([sectionName, fields]) => (
        <Card key={sectionName} title={sectionName} isCollapsible defaultCollapsed={false}>
          {fields.map(def => {
            const isAutoCalculated = def.key === 'u_diffProgressioniStoriche' || def.key === 'u_indennitaComparto';
            return (
              <FundingItem<DistribuzioneRisorseData>
                key={def.key}
                id={def.key}
                description={def.description}
                value={distribuzioneRisorseData[def.key] as number | undefined}
                onChange={(field, value) => handleChange(field, value)}
                riferimentoNormativo={def.riferimento}
                disabled={isAutoCalculated}
                inputInfo={isAutoCalculated ? "Valore calcolato automaticamente dalla pagina Personale in Servizio" : undefined}
              />
            );
          })}
        </Card>
      ))}

      <div className="mt-10 flex justify-end">
        <Button 
          variant="primary" 
          size="lg" 
          onClick={saveState}
        >
          Salva Distribuzione
        </Button>
      </div>
    </div>
  );
};
