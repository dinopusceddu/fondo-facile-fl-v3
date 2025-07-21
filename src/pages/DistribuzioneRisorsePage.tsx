// pages/DistribuzioneRisorsePage.tsx
import React, { useMemo, useEffect, useState } from 'react';
import { useAppContext } from '../contexts/AppContext.tsx';
import { Card } from '../components/shared/Card.tsx';
import { TEXTS_UI, distribuzioneFieldDefinitions } from '../constants.ts';
import { DistribuzioneRisorseData, RisorsaVariabileDetail } from '../types.ts';
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
  <div className="mb-0">
    <label className="block text-xs font-medium text-[#1b0e0e] pb-2">{label}</label>
    <div className="flex w-full min-w-0 flex-1 items-center rounded-lg text-[#1b0e0e] border border-transparent bg-[#fcf8f8] h-10 p-2 text-sm font-semibold">
      {value}
    </div>
    {info && <p className="mt-1 text-xs text-[#5f5252]">{info}</p>}
  </div>
);

export const DistribuzioneRisorsePage: React.FC = () => {
  const { state, dispatch, saveState } = useAppContext();
  const { fundData, calculatedFund } = state;
  const { dettagli: employees } = state.personaleServizio;
  const [isMaggiorazioneUserEdited, setIsMaggiorazioneUserEdited] = useState(false);

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
  
  const handleVariableChange = (
    field: keyof DistribuzioneRisorseData, 
    subField: keyof RisorsaVariabileDetail, 
    value?: number
  ) => {
    if (field === 'p_maggiorazionePerformanceIndividuale' && subField === 'stanziate') {
      setIsMaggiorazioneUserEdited(true);
    }
    const currentItem = distribuzioneRisorseData[field] as RisorsaVariabileDetail | undefined;
    const newItem = {
      ...currentItem,
      [subField]: value
    };
    dispatch({ type: 'UPDATE_DISTRIBUZIONE_RISORSE_DATA', payload: { [field]: newItem } });
  };

  const { p_performanceIndividuale, p_performanceOrganizzativa } = distribuzioneRisorseData;

  const handlePerfPercChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPercStr = e.target.value;
    const newPerc = newPercStr === '' ? undefined : parseFloat(newPercStr);
    
    dispatch({ type: 'UPDATE_DISTRIBUZIONE_RISORSE_DATA', payload: { criteri_percPerfIndividuale: newPerc }});

    if (newPerc !== undefined && newPerc >= 0 && newPerc <= 100) {
        const totalPerformanceBudget = (p_performanceIndividuale?.stanziate || 0) + (p_performanceOrganizzativa?.stanziate || 0);

        if (totalPerformanceBudget > 0) {
            const newIndividuale = totalPerformanceBudget * (newPerc / 100);
            const newOrganizzativa = totalPerformanceBudget - newIndividuale;
            
            dispatch({ 
                type: 'UPDATE_DISTRIBUZIONE_RISORSE_DATA', 
                payload: { 
                    p_performanceIndividuale: { ...p_performanceIndividuale, stanziate: parseFloat(newIndividuale.toFixed(2)) },
                    p_performanceOrganizzativa: { ...p_performanceOrganizzativa, stanziate: parseFloat(newOrganizzativa.toFixed(2)) }
                } 
            });
        }
    }
  };
  
  const utilizziParteStabile = useMemo(() => {
    const data = distribuzioneRisorseData || {};
    return (data.u_diffProgressioniStoriche || 0) +
           (data.u_indennitaComparto || 0) +
           (data.u_incrIndennitaEducatori?.stanziate || 0) +
           (data.u_incrIndennitaScolastico?.stanziate || 0) +
           (data.u_indennitaEx8QF?.stanziate || 0);
  }, [distribuzioneRisorseData]);
  
  const utilizziParteVariabile = useMemo(() => {
    const data = distribuzioneRisorseData || {};
    return Object.keys(data)
      .filter(key => key.startsWith('p_'))
      .reduce((sum, key) => {
          const value = data[key as keyof DistribuzioneRisorseData] as RisorsaVariabileDetail | undefined;
          return sum + (value?.stanziate || 0);
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

  const maggiorazioneProCapite = useMemo(() => {
    const percInd = distribuzioneRisorseData.criteri_percPerfIndividuale || 0;
    const percMagg = distribuzioneRisorseData.criteri_percMaggiorazionePremio || 0;

    if (numeroDipendenti === 0) return 0;

    const budgetIndividualeTeorico = importoDisponibileContrattazione * (percInd / 100);
    const premioMedioTeorico = budgetIndividualeTeorico / numeroDipendenti;
    return premioMedioTeorico * (percMagg / 100);

  }, [importoDisponibileContrattazione, distribuzioneRisorseData.criteri_percPerfIndividuale, distribuzioneRisorseData.criteri_percMaggiorazionePremio, numeroDipendenti]);
  
  useEffect(() => {
    const calculatedValue = maggiorazioneProCapite * numDipendentiBonus;
    if (isFinite(calculatedValue)) {
        const roundedValue = Math.round((calculatedValue + Number.EPSILON) * 100) / 100;
        
        if (!isMaggiorazioneUserEdited) {
            const currentValue = distribuzioneRisorseData.p_maggiorazionePerformanceIndividuale?.stanziate;
            if (currentValue !== roundedValue) {
                const currentItem = distribuzioneRisorseData.p_maggiorazionePerformanceIndividuale as RisorsaVariabileDetail | undefined;
                const newItem = {
                    ...currentItem,
                    stanziate: roundedValue
                };
                dispatch({ type: 'UPDATE_DISTRIBUZIONE_RISORSE_DATA', payload: { p_maggiorazionePerformanceIndividuale: newItem } });
            }
        }
    }
  }, [maggiorazioneProCapite, numDipendentiBonus, isMaggiorazioneUserEdited, dispatch, distribuzioneRisorseData.p_maggiorazionePerformanceIndividuale]);


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
                info="Calcolato come ((Disponibile contrattazione * % Perf. Individuale) / N. Dipendenti) * % Maggiorazione."
            />
        </div>
      </Card>
      
      {Object.entries(sections).map(([sectionName, fields]) => (
        <Card key={sectionName} title={sectionName} isCollapsible defaultCollapsed={false}>
            {fields.map(def => {
                 const specialStableKeys: (keyof DistribuzioneRisorseData)[] = ['u_incrIndennitaEducatori', 'u_incrIndennitaScolastico', 'u_indennitaEx8QF'];
                 if (sectionName === 'Utilizzi Parte Stabile (Art. 80 c.1)') {
                    const isAutoCalculated = def.key === 'u_diffProgressioniStoriche' || def.key === 'u_indennitaComparto';
                    const isSpecialStableField = specialStableKeys.includes(def.key);

                    if (isSpecialStableField) {
                      const value = distribuzioneRisorseData[def.key] as RisorsaVariabileDetail | undefined;
                      return (
                        <div key={def.key} className="py-4 border-b border-[#f3e7e8] last:border-b-0">
                            <div className="mb-3">
                                <p className="block text-sm text-[#1b0e0e] font-medium">{def.description}</p>
                                <p className="text-xs text-[#5f5252] mt-0.5">{def.riferimento}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                              <Input
                                label="Risorse stanziate (€)"
                                type="number"
                                id={`${def.key}-stanziate`}
                                value={value?.stanziate ?? ''}
                                onChange={(e) => handleVariableChange(def.key, 'stanziate', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                                step="0.01"
                                containerClassName="mb-0"
                                labelClassName="text-xs"
                                inputClassName="h-10 text-sm"
                              />
                              <Input
                                label="Risparmi (€)"
                                type="number"
                                id={`${def.key}-risparmi`}
                                value={value?.risparmi ?? ''}
                                onChange={(e) => handleVariableChange(def.key, 'risparmi', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                                step="0.01"
                                containerClassName="mb-0"
                                labelClassName="text-xs"
                                inputClassName="h-10 text-sm"
                                disabled={!distribuzioneRisorseData.criteri_isConsuntivoMode}
                                inputInfo={!distribuzioneRisorseData.criteri_isConsuntivoMode ? "Abilitato in modalità consuntivo" : undefined}
                              />
                            </div>
                        </div>
                      );
                    }

                    return (
                        <FundingItem<DistribuzioneRisorseData>
                            key={def.key}
                            id={def.key}
                            description={def.description}
                            value={distribuzioneRisorseData[def.key] as number | undefined}
                            onChange={(field, value) => handleChange(field, value as number)}
                            riferimentoNormativo={def.riferimento}
                            disabled={isAutoCalculated}
                            inputInfo={isAutoCalculated ? "Valore calcolato automaticamente dalla pagina Personale in Servizio" : undefined}
                        />
                    );
                 }
                 
                 const value = distribuzioneRisorseData[def.key] as RisorsaVariabileDetail | undefined;
                 const percentage = importoDisponibileContrattazione > 0 ? ((value?.stanziate || 0) / importoDisponibileContrattazione) * 100 : 0;
                 let stanziateInputInfo: string | undefined = undefined;
                 if (def.key === 'p_maggiorazionePerformanceIndividuale') {
                     stanziateInputInfo = "Calcolato da Criteri, ma modificabile.";
                 }

                 return (
                    <div key={def.key} className="py-4 border-b border-[#f3e7e8] last:border-b-0">
                        <div className="mb-3">
                            <p className="block text-sm text-[#1b0e0e] font-medium">{def.description}</p>
                            <p className="text-xs text-[#5f5252] mt-0.5">{def.riferimento}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
                          <Input
                            label="Risorse stanziate (€)"
                            type="number"
                            id={`${def.key}-stanziate`}
                            value={value?.stanziate ?? ''}
                            onChange={(e) => handleVariableChange(def.key, 'stanziate', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                            step="0.01"
                            containerClassName="mb-0"
                            labelClassName="text-xs"
                            inputClassName="h-10 text-sm"
                            inputInfo={stanziateInputInfo}
                          />
                          <DisplayField 
                            label="% sul variabile"
                            value={`${percentage.toFixed(2)}%`}
                          />
                          <Input
                            label="Risparmi (€)"
                            type="number"
                            id={`${def.key}-risparmi`}
                            value={value?.risparmi ?? ''}
                            onChange={(e) => handleVariableChange(def.key, 'risparmi', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                            step="0.01"
                            containerClassName="mb-0"
                            labelClassName="text-xs"
                            inputClassName="h-10 text-sm"
                            disabled={!distribuzioneRisorseData.criteri_isConsuntivoMode}
                            inputInfo={!distribuzioneRisorseData.criteri_isConsuntivoMode ? "Abilitato in modalità consuntivo" : undefined}
                          />
                          <Input
                            label="Risorse a bilancio (€)"
                            type="number"
                            id={`${def.key}-aBilancio`}
                            value={value?.aBilancio ?? ''}
                            onChange={(e) => handleVariableChange(def.key, 'aBilancio', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                            step="0.01"
                            containerClassName="mb-0"
                            labelClassName="text-xs"
                            inputClassName="h-10 text-sm"
                            disabled={!distribuzioneRisorseData.criteri_isConsuntivoMode}
                            inputInfo={!distribuzioneRisorseData.criteri_isConsuntivoMode ? "Abilitato in modalità consuntivo" : undefined}
                          />
                        </div>
                    </div>
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