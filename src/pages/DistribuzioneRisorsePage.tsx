// pages/DistribuzioneRisorsePage.tsx
import React, { useMemo, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext.js';
import { Card } from '../components/shared/Card.js';
import { TEXTS_UI, distribuzioneFieldDefinitions } from '../constants.js';
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
  } = fundData;

  // Totale da Distribuire = TOTALE RISORSE DISPONIBILI: nella pagina Fondo accessorio personale dipendente
  const totaleDaDistribuire = calculatedFund.dettaglioFondi.dipendente.totale;

  // Handle changes to allocation inputs
  const handleChange = (field: keyof DistribuzioneRisorseData, value?: number) => {
    dispatch({ type: 'UPDATE_DISTRIBUZIONE_RISORSE_DATA', payload: { [field]: value } });
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
      .reduce((sum, key) => sum + (data[key as keyof DistribuzioneRisorseData] || 0), 0);
  }, [distribuzioneRisorseData]);

  // Totale Allocato = Utilizzi Parte Stabile (Art. 80 c.1) + Utilizzi Parte Variabile (Art. 80 c.2)
  const totaleAllocato = useMemo(() => {
    return utilizziParteStabile + utilizziParteVariabile;
  }, [utilizziParteStabile, utilizziParteVariabile]);

  // Importo Rimanente = Totale da Distribuire - Totale Allocato
  const importoRimanente = totaleDaDistribuire - totaleAllocato;

  // Importo disponibile alla contrattazione = Totale da Distribuire - Utilizzi Parte Stabile (Art. 80 c.1)
  const importoDisponibileContrattazione = useMemo(() => {
    return totaleDaDistribuire - utilizziParteStabile;
  }, [totaleDaDistribuire, utilizziParteStabile]);

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
      
      {Object.entries(sections).map(([sectionName, fields]) => (
        <Card key={sectionName} title={sectionName} isCollapsible defaultCollapsed={false}>
          {fields.map(def => {
            const isAutoCalculated = def.key === 'u_diffProgressioniStoriche' || def.key === 'u_indennitaComparto';
            return (
              <FundingItem<DistribuzioneRisorseData>
                key={def.key}
                id={def.key}
                description={def.description}
                value={distribuzioneRisorseData[def.key]}
                onChange={handleChange}
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
