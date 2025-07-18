// pages/DistribuzioneRisorsePage.tsx
import React, { useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext.js';
import { Card } from '../components/shared/Card.js';
import { TEXTS_UI, distribuzioneFieldDefinitions } from '../constants.js';
import { calculateFadTotals } from '../logic/fundEngine.js';
import { DistribuzioneRisorseData } from '../types.js';
import { FundingItem } from '../components/shared/FundingItem.js';
import { Button } from '../components/shared/Button.js';

const formatCurrency = (value?: number, defaultText = TEXTS_UI.notApplicable) => {
  if (value === undefined || value === null || isNaN(value)) return defaultText;
  return `€ ${value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const DistribuzioneRisorsePage: React.FC = () => {
  const { state, dispatch, saveState } = useAppContext();
  const { fundData, calculatedFund } = state;

  if (!calculatedFund) {
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
    fondoAccessorioDipendenteData,
    annualData,
    fondoElevateQualificazioniData,
    distribuzioneRisorseData,
  } = fundData;

  const {
    simulatoreRisultati,
    isEnteDissestato,
    isEnteStrutturalmenteDeficitario,
    isEnteRiequilibrioFinanziario,
  } = annualData;
  
  const isEnteInCondizioniSpeciali = !!isEnteDissestato || !!isEnteStrutturalmenteDeficitario || !!isEnteRiequilibrioFinanziario;
  const incrementoEQconRiduzioneDipendenti = fondoElevateQualificazioniData?.ris_incrementoConRiduzioneFondoDipendenti;

  // Calculate total available resources from FAD
  const fadTotals = calculateFadTotals(
    fondoAccessorioDipendenteData || {},
    simulatoreRisultati,
    isEnteInCondizioniSpeciali,
    incrementoEQconRiduzioneDipendenti
  );
  const risorseDaDistribuire = fadTotals.totaleRisorseDisponibiliContrattazione_Dipendenti;

  // Handle changes to allocation inputs
  const handleChange = (field: keyof DistribuzioneRisorseData, value?: number) => {
    dispatch({ type: 'UPDATE_DISTRIBUZIONE_RISORSE_DATA', payload: { [field]: value } });
  };
  
  // Calculate total allocated and remaining amount
  const totaleAllocato = useMemo(() => {
    return Object.values(distribuzioneRisorseData || {}).reduce((sum, value) => sum + (value || 0), 0);
  }, [distribuzioneRisorseData]);

  const importoRimanente = risorseDaDistribuire - totaleAllocato;

  // Group fields by section
  const sections = useMemo(() => 
    distribuzioneFieldDefinitions.reduce((acc, field) => {
      (acc[field.section] = acc[field.section] || []).push(field);
      return acc;
    }, {} as Record<string, typeof distribuzioneFieldDefinitions>)
  , []);

  return (
    <div className="space-y-8 pb-24"> {/* Padding bottom for sticky bar */}
      <h2 className="text-[#1b0e0e] tracking-light text-2xl sm:text-[30px] font-bold leading-tight">Distribuzione delle Risorse del Fondo</h2>
      
      <Card title="Riepilogo Risorse e Allocazione" className="sticky top-[63px] z-30 bg-white/90 backdrop-blur-sm border-b-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#fcf8f8] rounded-lg text-center">
            <h4 className="text-sm font-medium text-[#5f5252]">Totale da Distribuire</h4>
            <p className="text-2xl font-bold text-[#1b0e0e]">{formatCurrency(risorseDaDistribuire)}</p>
          </div>
          <div className="p-4 bg-[#fcf8f8] rounded-lg text-center">
            <h4 className="text-sm font-medium text-[#5f5252]">Totale Allocato</h4>
            <p className={`text-2xl font-bold ${importoRimanente < 0 ? 'text-[#c02128]' : 'text-green-600'}`}>
              {formatCurrency(totaleAllocato)}
            </p>
          </div>
          <div className={`p-4 rounded-lg text-center transition-colors ${importoRimanente < 0 ? 'bg-[#fef2f2]' : 'bg-[#f0fdf4]'}`}>
            <h4 className="text-sm font-medium text-[#5f5252]">Importo Rimanente</h4>
            <p className={`text-2xl font-bold ${importoRimanente < 0 ? 'text-[#c02128]' : 'text-green-700'}`}>
              {formatCurrency(importoRimanente)}
            </p>
          </div>
        </div>
        {importoRimanente < 0 && (
          <p className="text-center text-sm text-red-600 font-semibold mt-3 p-2 bg-red-50 rounded-md">
            Attenzione: l'importo allocato supera le risorse disponibili.
          </p>
        )}
      </Card>
      
      {Object.entries(sections).map(([sectionName, fields]) => (
        <Card key={sectionName} title={sectionName} isCollapsible defaultCollapsed>
          {fields.map(def => (
            <FundingItem<DistribuzioneRisorseData>
              key={def.key}
              id={def.key}
              description={def.description}
              value={distribuzioneRisorseData[def.key]}
              onChange={handleChange}
              riferimentoNormativo={def.riferimento}
            />
          ))}
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