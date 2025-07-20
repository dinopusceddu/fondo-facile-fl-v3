// pages/FondoAccessorioDipendentePageHelpers.ts
import { FondoAccessorioDipendenteData } from '../types.ts';

export const fadFieldDefinitions: Array<{
  key: keyof FondoAccessorioDipendenteData;
  description: string;
  riferimento: string;
  isRelevantToArt23Limit?: boolean;
  isSubtractor?: boolean;
  section: 'stabili' | 'vs_soggette' | 'vn_non_soggette' | 'fin_decurtazioni' | 'cl_limiti';
  isDisabledByCondizioniSpeciali?: boolean; 
}> = [
  // Stabili
  { key: 'st_art79c1_art67c1_unicoImporto2017', description: "Unico importo consolidato 2017", riferimento: "Art. 79 c.1 (rif. Art. 67 c.1 CCNL 2018)", isRelevantToArt23Limit: true, section: 'stabili' },
  { key: 'st_art79c1_art67c1_alteProfessionalitaNonUtil', description: "Alte professionalità non utilizzate (se non in unico importo)", riferimento: "Art. 79 c.1 (rif. Art. 67 c.1 CCNL 2018)", isRelevantToArt23Limit: true, section: 'stabili' },
  { key: 'st_art79c1_art67c2a_incr8320', description: "Incremento €83,20/unità (personale 31.12.2015)", riferimento: "Art. 79 c.1 (rif. Art. 67 c.2a CCNL 2018)", isRelevantToArt23Limit: false, section: 'stabili' },
  { key: 'st_art79c1_art67c2b_incrStipendialiDiff', description: "Incrementi stipendiali differenziali (Art. 64 CCNL 2018)", riferimento: "Art. 79 c.1 (rif. Art. 67 c.2b CCNL 2018)", isRelevantToArt23Limit: false, section: 'stabili' },
  { key: 'st_art79c1_art4c2_art67c2c_integrazioneRIA', description: "Integrazione RIA personale cessato anno precedente", riferimento: "Art. 79 c.1 (rif. Art. 67 c.2c CCNL 2018)", isRelevantToArt23Limit: true, section: 'stabili' },
  { key: 'st_art79c1_art67c2d_risorseRiassorbite165', description: "Risorse riassorbite (Art. 2 c.3 D.Lgs 165/01)", riferimento: "Art. 79 c.1 (rif. Art. 67 c.2d CCNL 2018)", isRelevantToArt23Limit: true, section: 'stabili' },
  { key: 'st_art79c1_art15c1l_art67c2e_personaleTrasferito', description: "Risorse personale trasferito (decentramento)", riferimento: "Art. 79 c.1 (rif. Art. 67 c.2e CCNL 2018)", isRelevantToArt23Limit: true, section: 'stabili' },
  { key: 'st_art79c1_art15c1i_art67c2f_regioniRiduzioneDirig', description: "Regioni: riduzione stabile posti dirig. (fino a 0,2% MS Dir.)", riferimento: "Art. 79 c.1 (rif. Art. 67 c.2f CCNL 2018)", isRelevantToArt23Limit: true, section: 'stabili' },
  { key: 'st_art79c1_art14c3_art67c2g_riduzioneStraordinario', description: "Riduzione stabile straordinario", riferimento: "Art. 79 c.1 (rif. Art. 67 c.2g CCNL 2018)", isRelevantToArt23Limit: true, section: 'stabili' },
  { key: 'st_taglioFondoDL78_2010', description: "Taglio fondo DL 78/2010 (se non già in unico importo)", riferimento: "Art. 9 c.2bis DL 78/2010", isRelevantToArt23Limit: true, isSubtractor: true, section: 'stabili' },
  { key: 'st_riduzioniPersonaleATA_PO_Esternalizzazioni', description: "Riduzioni per pers. ATA, PO, esternalizzazioni, trasferimenti", riferimento: "Disposizioni specifiche", isRelevantToArt23Limit: true, isSubtractor: true, section: 'stabili' },
  { key: 'st_art67c1_decurtazionePO_AP_EntiDirigenza', description: "Decurtazione PO/AP enti con dirigenza (Art. 67 c.1 CCNL 2018)", riferimento: "Art. 67 c.1 CCNL 2018", isRelevantToArt23Limit: true, isSubtractor: true, section: 'stabili' },
  { key: 'st_art79c1b_euro8450', description: "Incremento €84,50/unità (personale 31.12.2018, da 01.01.2021)", riferimento: "Art. 79 c.1b CCNL 2022", isRelevantToArt23Limit: false, section: 'stabili' },
  { key: 'st_art79c1c_incrementoStabileConsistenzaPers', description: "Incremento stabile per consistenza personale (Art. 23c2)", riferimento: "Art. 79 c.1c CCNL 2022", isRelevantToArt23Limit: true, section: 'stabili' },
  { key: 'st_art79c1d_differenzialiStipendiali2022', description: "Differenziali stipendiali personale in servizio 2022", riferimento: "Art. 79 c.1d CCNL 2022", isRelevantToArt23Limit: false, section: 'stabili' },
  { key: 'st_art79c1bis_diffStipendialiB3D3', description: "Differenze stipendiali personale B3 e D3", riferimento: "Art. 79 c.1-bis CCNL 2022", isRelevantToArt23Limit: false, section: 'stabili' },
  