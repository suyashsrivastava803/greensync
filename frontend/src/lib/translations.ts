export type Language = "en" | "hi" | "es";

export interface LanguageOption {
  code: Language;
  label: string;
  nativeName: string;
  flag: string;
}

export const AVAILABLE_LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "hi", label: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "es", label: "Spanish", nativeName: "Español", flag: "🇪🇸" },
];

export interface Translations {
  // Header
  substationTitle: string;
  controllerTitle: string;
  substationNode: string;
  pccInterconnect: string;
  gridTied: string;
  islanded: string;
  busVoltage: string;
  busFreq: string;
  controllerMode: string;
  modeAutonomous: string;
  modePeakShaving: string;
  modeIslanded: string;
  modeForceCharge: string;
  scadaClock: string;

  // Single-Line Diagram
  sldTitle: string;
  sldSubtitle: string;
  activeBusBalance: string;
  generation: string;
  demand: string;
  acBusLabel: string;
  threePhase: string;
  solarArray: string;
  solarSpecs: string;
  bessStorage: string;
  bessSpecs: string;
  facilityLoad: string;
  facilitySpecs: string;
  gridInterconnect: string;
  gridSpecs: string;
  criticalLoad: string;
  netGridDeficit: string;
  breakerClosed: string;
  breakerOpen: string;
  importing: string;
  exporting: string;
  charging: string;
  discharging: string;
  standby: string;

  // Weather & Ramp
  weatherTitle: string;
  weatherSubtitle: string;
  ghiIrradiance: string;
  cloudCover: string;
  ambientTemp: string;
  windSpeed: string;
  rampDetectedTitle: string;
  rampDetectedDesc: string;
  rampStableTitle: string;
  openWeatherLive: string;
  atmosphericEngine: string;

  // Battery
  bessTelemetryTitle: string;
  bessTelemetrySubtitle: string;
  stateOfCharge: string;
  safeDodLimit: string;
  cRate: string;
  cRateRated: string;
  cellTemp: string;
  cellTempNominal: string;
  wearTearCost: string;
  wearTearRate: string;
  stateOfHealth: string;

  // Forecaster
  forecastTitle: string;
  forecastSubtitle: string;
  demandP50: string;
  solarP50: string;
  tariffRate: string;
  bandsP10P90: string;
  stepTime: string;

  // Dispatch Matrix
  scheduleTitle: string;
  scheduleSubtitle: string;
  filterAll: string;
  filterPeak: string;
  filterStorage: string;
  filterExport: string;
  colInterval: string;
  colDemand: string;
  colSolar: string;
  colBess: string;
  colGrid: string;
  colSoc: string;
  colTariff: string;
  colDecision: string;
  actionPeakShaving: string;
  actionStoreSolar: string;
  actionCleanExport: string;
  actionIslandedSupport: string;
  actionForceCharge: string;
  actionSelfConsume: string;
  rationaleLabel: string;
  stepCost: string;
  baselineCost: string;
  savedLabel: string;

  // Economic Impact
  impactTitle: string;
  impactSubtitle: string;
  rollingHorizonLabel: string;
  netSavings: string;
  vsUnmanaged: string;
  carbonAbated: string;
  gridDisplacement: string;
  optimizedCost: string;
  inclWear: string;
  unmanagedBaseline: string;
  netDeficitGrid: string;
  expenseComparison: string;
  payingPercentage: string;

  // What-If Simulator
  whatIfTitle: string;
  whatIfSubtitle: string;
  scenCloudTitle: string;
  scenCloudDesc: string;
  scenGridTitle: string;
  scenGridDesc: string;
  scenSurgeTitle: string;
  scenSurgeDesc: string;
  scenResetTitle: string;
  scenResetDesc: string;

  // SCADA Controls
  controlsTitle: string;
  controlsSubtitle: string;
  auditLogBtn: string;
  operatingModeLabel: string;
  ansiBreakersLabel: string;
  solarInverterTrip: string;
  bessStorageTrip: string;
  gridUtilityTie: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Header
    substationTitle: "GreenSync",
    controllerTitle: "IEEE 2030.7 Controller",
    substationNode: "Substation Node #04",
    pccInterconnect: "PCC Interconnect:",
    gridTied: "GRID-TIED (SYNCED)",
    islanded: "ISLANDED (OFF-GRID)",
    busVoltage: "Bus:",
    busFreq: "Freq:",
    controllerMode: "Mode:",
    modeAutonomous: "AUTONOMOUS OPTIMAL",
    modePeakShaving: "PEAK SHAVING",
    modeIslanded: "ISLANDED BACKUP",
    modeForceCharge: "FORCE CHARGE",
    scadaClock: "SCADA Clock",

    // Single-Line Diagram
    sldTitle: "Microgrid Single-Line Diagram (SLD)",
    sldSubtitle: "IEEE 1547 Topology",
    activeBusBalance: "Active Bus Balance:",
    generation: "Generation",
    demand: "Demand",
    acBusLabel: "AC BUS 415V",
    threePhase: "3-PHASE 50Hz",
    solarArray: "Solar Array",
    solarSpecs: "120 kWp Bifacial",
    bessStorage: "BESS Storage",
    bessSpecs: "240 kWh LiFePO4",
    facilityLoad: "Facility Load",
    facilitySpecs: "HVAC + Manufacturing",
    gridInterconnect: "Grid Interconnect",
    gridSpecs: "11kV / 415V PCC",
    criticalLoad: "CRITICAL: 65%",
    netGridDeficit: "Net Grid Deficit:",
    breakerClosed: "CLOSED",
    breakerOpen: "OPEN",
    importing: "Importing:",
    exporting: "Exporting:",
    charging: "Charging:",
    discharging: "Discharging:",
    standby: "Standby:",

    // Weather & Ramp
    weatherTitle: "Atmospheric & Cloud Ramp Sensor",
    weatherSubtitle: "Live Pyranometer GHI & Satellite Ingestion",
    ghiIrradiance: "GHI Irradiance",
    cloudCover: "Cloud Cover",
    ambientTemp: "Ambient Temp",
    windSpeed: "Wind Velocity",
    rampDetectedTitle: "Active Cloud Ramp Event Detected",
    rampDetectedDesc: "Rapid irradiance plunge: Solar output dropped sharply. GreenSync optimizer has engaged BESS fast-discharge cushioning.",
    rampStableTitle: "Atmospheric Gradient Stable • Solar Profile Steady",
    openWeatherLive: "OpenWeather API (Live)",
    atmosphericEngine: "Atmospheric Physics Engine",

    // Battery
    bessTelemetryTitle: "BESS Telemetry & Cell Degradation",
    bessTelemetrySubtitle: "240 kWh LiFePO4 Pack • IEEE 1547 Envelope",
    stateOfCharge: "State of Charge",
    safeDodLimit: "Safe DoD Limits: 20% - 95%",
    cRate: "Current C-Rate:",
    cRateRated: "Rated Max: 0.33C",
    cellTemp: "Cell Pack Temp:",
    cellTempNominal: "Nominal: 20-35°C",
    wearTearCost: "Wear & Tear Cost:",
    wearTearRate: "@ $0.035/kWh cycled",
    stateOfHealth: "SoH",

    // Forecaster
    forecastTitle: "Rolling 6-Hour Horizon Forecaster",
    forecastSubtitle: "Multivariate time-series with P10/P50/P90 confidence intervals • 15-min resolution",
    demandP50: "Demand (P50)",
    solarP50: "Solar PV (P50)",
    tariffRate: "Tariff ($/kWh)",
    bandsP10P90: "P10-P90 Bands",
    stepTime: "Step:",

    // Dispatch Matrix
    scheduleTitle: "Dispatch Recommendations",
    scheduleSubtitle: "Rule-based dispatch estimates across the forecast horizon",
    filterAll: "ALL",
    filterPeak: "PEAK",
    filterStorage: "STORAGE",
    filterExport: "EXPORT",
    colInterval: "Interval",
    colDemand: "Demand",
    colSolar: "Solar",
    colBess: "BESS Power",
    colGrid: "Grid Flow",
    colSoc: "SoC",
    colTariff: "Tariff",
    colDecision: "Decision Choice",
    actionPeakShaving: "Peak Shaving",
    actionStoreSolar: "Store Solar",
    actionCleanExport: "Clean Export",
    actionIslandedSupport: "Islanded Support",
    actionForceCharge: "Force Charge",
    actionSelfConsume: "Self-Consume",
    rationaleLabel: "Optimization Rationale:",
    stepCost: "Step Cost:",
    baselineCost: "Baseline:",
    savedLabel: "Saved",

    // Economic Impact
    impactTitle: "Economic Dispatch ROI & Carbon Impact",
    impactSubtitle: "GreenSync Optimization vs Unmanaged Utility Grid Baseline",
    rollingHorizonLabel: "Rolling 6-Hour Horizon",
    netSavings: "Net Financial Savings",
    vsUnmanaged: "vs unmanaged grid import",
    carbonAbated: "CO₂ Emissions Abated",
    gridDisplacement: "0.71 kg/kWh grid displacement",
    optimizedCost: "Optimized Cost",
    inclWear: "incl. battery wear",
    unmanagedBaseline: "Unmanaged Baseline",
    netDeficitGrid: "100% net deficit to grid",
    expenseComparison: "Expense Comparison:",
    payingPercentage: "GreenSync pays only",

    // What-If Simulator
    whatIfTitle: "Interactive \"What-If\" Scenario Sandbox",
    whatIfSubtitle: "Stress-test optimizer resilience against sudden weather, grid, and load transients",
    scenCloudTitle: "Sudden Cloud Front",
    scenCloudDesc: "Simulate 80% solar irradiance drop; triggers BESS cushioning.",
    scenGridTitle: "Utility Grid Outage",
    scenGridDesc: "PCC breaker trips; forces seamless autonomous islanding.",
    scenSurgeTitle: "Industrial Load Surge",
    scenSurgeDesc: "Heavy equipment motor start; tests peak shaving limits.",
    scenResetTitle: "Reset Baseline",
    scenResetDesc: "Close all breakers and restore nominal IEEE baseline.",

    // SCADA Controls
    controlsTitle: "SCADA Supervisory Overrides",
    controlsSubtitle: "IEEE 2030.7 Operating Modes & ANSI Breaker Protection",
    auditLogBtn: "Audit Log",
    operatingModeLabel: "Microgrid Controller Operating Mode:",
    ansiBreakersLabel: "ANSI Device Breakers:",
    solarInverterTrip: "Inverter Trip",
    bessStorageTrip: "Storage Trip",
    gridUtilityTie: "Utility Tie",
  },

  hi: {
    // Header
    substationTitle: "GreenSync",
    controllerTitle: "IEEE 2030.7 नियंत्रक",
    substationNode: "सबस्टेशन नोड #04",
    pccInterconnect: "PCC ग्रिड:",
    gridTied: "ग्रिड-टाइड",
    islanded: "आइसलैंडेड",
    busVoltage: "बस:",
    busFreq: "आवृत्ति:",
    controllerMode: "मोड:",
    modeAutonomous: "स्वायत्त अनुकूलित",
    modePeakShaving: "पीक शेविंग",
    modeIslanded: "आइसलैंडेड बैकअप",
    modeForceCharge: "फोर्स चार्जिंग",
    scadaClock: "SCADA घड़ी",

    // Single-Line Diagram
    sldTitle: "माइक्रोग्रिड सिंगल-लाइन आरेख (SLD)",
    sldSubtitle: "IEEE 1547 ग्रिड",
    activeBusBalance: "सक्रिय ऊर्जा संतुलन:",
    generation: "उत्पादन",
    demand: "मांग",
    acBusLabel: "AC बस 415V",
    threePhase: "3-फेज 50Hz",
    solarArray: "सोलर PV",
    solarSpecs: "120 kWp बायोफेशियल",
    bessStorage: "BESS स्टोरेज",
    bessSpecs: "240 kWh LiFePO4",
    facilityLoad: "कारखाना लोड",
    facilitySpecs: "HVAC + उत्पादन",
    gridInterconnect: "मुख्य ग्रिड",
    gridSpecs: "11kV / 415V PCC",
    criticalLoad: "क्रिटिकल: 65%",
    netGridDeficit: "शुद्ध ग्रिड कमी:",
    breakerClosed: "चालू",
    breakerOpen: "खुला",
    importing: "आयात:",
    exporting: "निर्यात:",
    charging: "चार्जिंग:",
    discharging: "डिस्चार्जिंग:",
    standby: "स्टैंडबाय:",

    // Weather & Ramp
    weatherTitle: "मौसम एवं क्लाउड रैंप सेंसर",
    weatherSubtitle: "लाइव पायरानोमीटर सौर विकिरण व उपग्रह फीड",
    ghiIrradiance: "सौर विकिरण",
    cloudCover: "बादल आवरण",
    ambientTemp: "तापमान",
    windSpeed: "हवा गति",
    rampDetectedTitle: "क्लाउड रैंप घटना पहचानी गई",
    rampDetectedDesc: "सौर विकिरण में भारी गिरावट। ग्रीनसिंक BESS बैकअप त्वरित सक्रिय।",
    rampStableTitle: "वातावरणीय स्थिति सामान्य • सौर प्रोफाइल स्थिर",
    openWeatherLive: "ओपनवेदर लाइव API",
    atmosphericEngine: "भौतिकी विकिरण इंजन",

    // Battery
    bessTelemetryTitle: "बैटरी स्वास्थ्य एवं चक्र गिरावट",
    bessTelemetrySubtitle: "240 kWh LiFePO4 पैक • सुरक्षित सीमाएं",
    stateOfCharge: "SoC चार्ज स्तर",
    safeDodLimit: "सुरक्षित DoD: 20% - 95%",
    cRate: "वर्तमान C-दर:",
    cRateRated: "अधिकतम दर: 0.33C",
    cellTemp: "बैटरी तापमान:",
    cellTempNominal: "सामान्य: 20-35°C",
    wearTearCost: "घिसाव लागत:",
    wearTearRate: "@ $0.035 प्रति kWh",
    stateOfHealth: "SoH स्वास्थ्य",

    // Forecaster
    forecastTitle: "6-घंटे का रोलिंग पूर्वानुमान",
    forecastSubtitle: "मशीन लर्निंग P10/P50/P90 मॉडल • 15 मिनट अंतराल",
    demandP50: "मांग P50",
    solarP50: "सौर P50",
    tariffRate: "टैरिफ ($/kWh)",
    bandsP10P90: "अनिश्चितता सीमाएं",
    stepTime: "समय:",

    // Dispatch Matrix
    scheduleTitle: "ऊर्जा प्रेषण अनुसूची",
    scheduleSubtitle: "लीनियर प्रोग्रामिंग द्वारा 24 अंतरालों में स्वचालित स्विचिंग",
    filterAll: "सभी",
    filterPeak: "पीक",
    filterStorage: "स्टोरेज",
    filterExport: "निर्यात",
    colInterval: "अंतराल",
    colDemand: "मांग",
    colSolar: "सोलर",
    colBess: "BESS पावर",
    colGrid: "ग्रिड प्रवाह",
    colSoc: "SoC",
    colTariff: "टैरिफ",
    colDecision: "निर्णय",
    actionPeakShaving: "पीक शेविंग",
    actionStoreSolar: "सोलर संग्रह",
    actionCleanExport: "स्वच्छ निर्यात",
    actionIslandedSupport: "आइसलैंड सहारा",
    actionForceCharge: "फोर्स चार्ज",
    actionSelfConsume: "स्व-उपभोग",
    rationaleLabel: "अनुकूलन तर्क:",
    stepCost: "कदम लागत:",
    baselineCost: "बेसलाइन:",
    savedLabel: "बचत",

    // Economic Impact
    impactTitle: "आर्थिक बचत एवं कार्बन प्रभाव",
    impactSubtitle: "पारंपरिक ग्रिड बनाम ग्रीनसिंक अनुकूलन",
    rollingHorizonLabel: "6 घंटे का परिदृश्य",
    netSavings: "शुद्ध वित्तीय बचत",
    vsUnmanaged: "पारंपरिक ग्रिड की तुलना में",
    carbonAbated: "कम किया गया कार्बन (CO₂)",
    gridDisplacement: "0.71 kg/kWh ग्रिड विस्थापन",
    optimizedCost: "अनुकूलित लागत",
    inclWear: "बैटरी घिसाव सहित",
    unmanagedBaseline: "पारंपरिक बेसलाइन",
    netDeficitGrid: "100% ग्रिड से खरीद",
    expenseComparison: "खर्च तुलना:",
    payingPercentage: "ग्रीनसिंक में भुगतान केवल",

    // What-If Simulator
    whatIfTitle: "इंटरैक्टिव 'व्हाट-इफ' परिदृश्य सैंडबॉक्स",
    whatIfSubtitle: "अचानक मौसम, ग्रिड विफलता और लोड स्पाइक्स पर परीक्षण",
    scenCloudTitle: "अचानक घने बादल (88%)",
    scenCloudDesc: "80% सौर गिरावट का अनुकरण; तुरंत BESS बैकअप परीक्षण।",
    scenGridTitle: "ग्रिड ब्लैकआउट (आउटेज)",
    scenGridDesc: "PCC ब्रेकर ट्रिप; माइक्रोग्रिड स्वतः अलग होकर चलता है।",
    scenSurgeTitle: "औद्योगिक लोड वृद्धि (+130 kW)",
    scenSurgeDesc: "भारी मोटरों का अचानक चालू होना; पीक शेविंग सीमा परीक्षण।",
    scenResetTitle: "सामान्य रीसेट",
    scenResetDesc: "सभी ब्रेकर बंद कर सामान्य ग्रिड व्यवस्था पुनर्स्थापित करें।",

    // SCADA Controls
    controlsTitle: "SCADA पर्यवेक्षी नियंत्रण एवं ओवरराइड्स",
    controlsSubtitle: "IEEE 2030.7 नियंत्रण मोड व ब्रेकर सुरक्षा",
    auditLogBtn: "ऑडिट लॉग",
    operatingModeLabel: "माइक्रोग्रिड नियंत्रक ऑपरेटिंग मोड:",
    ansiBreakersLabel: "ANSI सर्किट ब्रेकर्स:",
    solarInverterTrip: "सोलर इन्वर्टर",
    bessStorageTrip: "बैटरी इन्वर्टर",
    gridUtilityTie: "मुख्य ग्रिड टाई",
  },

  es: {
    // Header
    substationTitle: "GreenSync",
    controllerTitle: "Controlador IEEE 2030.7",
    substationNode: "Nodo Subestación #04",
    pccInterconnect: "Interconexión PCC:",
    gridTied: "CONECTADO A RED (SYNC)",
    islanded: "AISLADO (OFF-GRID)",
    busVoltage: "Barra:",
    busFreq: "Frec:",
    controllerMode: "Modo:",
    modeAutonomous: "ÓPTIMO AUTÓNOMO",
    modePeakShaving: "RECORTE DE PICOS",
    modeIslanded: "RESPALDO AISLADO",
    modeForceCharge: "CARGA FORZADA",
    scadaClock: "Reloj SCADA",

    // Single-Line Diagram
    sldTitle: "Diagrama Unifilar de Microred (SLD)",
    sldSubtitle: "Topología IEEE 1547",
    activeBusBalance: "Balance de Barra Activo:",
    generation: "Generación",
    demand: "Demanda",
    acBusLabel: "BARRA CA 415V",
    threePhase: "TRIFÁSICO 50Hz",
    solarArray: "Parque Solar",
    solarSpecs: "120 kWp Bifacial",
    bessStorage: "Almacenamiento BESS",
    bessSpecs: "240 kWh LiFePO4",
    facilityLoad: "Carga Industrial",
    facilitySpecs: "HVAC + Manufactura",
    gridInterconnect: "Conexión a Red",
    gridSpecs: "PCC 11kV / 415V",
    criticalLoad: "CRÍTICA: 65%",
    netGridDeficit: "Déficit Neto de Red:",
    breakerClosed: "CERRADO",
    breakerOpen: "ABIERTO",
    importing: "Importando:",
    exporting: "Exportando:",
    charging: "Cargando:",
    discharging: "Descargando:",
    standby: "En Espera:",

    // Weather & Ramp
    weatherTitle: "Sensor Atmosférico y Rampa Solar",
    weatherSubtitle: "Piranómetro GHI en Vivo y Satélite",
    ghiIrradiance: "Irradiancia GHI",
    cloudCover: "Nubosidad",
    ambientTemp: "Temp. Ambiente",
    windSpeed: "Velocidad Viento",
    rampDetectedTitle: "Evento de Rampa Solar Detectado",
    rampDetectedDesc: "Caída abrupta de irradiancia. El optimizador GreenSync amortigua la carga con BESS.",
    rampStableTitle: "Gradiente Atmosférico Estable • Perfil Solar Regular",
    openWeatherLive: "API OpenWeather (En Vivo)",
    atmosphericEngine: "Modelo Físico Atmosférico",

    // Battery
    bessTelemetryTitle: "Telemetría BESS y Degradación",
    bessTelemetrySubtitle: "Batería 240 kWh LiFePO4 • Límites IEEE 1547",
    stateOfCharge: "Estado de Carga (SoC)",
    safeDodLimit: "Límite Seguro DoD: 20% - 95%",
    cRate: "Tasa C Actual:",
    cRateRated: "Máx Nominal: 0.33C",
    cellTemp: "Temp. de Celdas:",
    cellTempNominal: "Nominal: 20-35°C",
    wearTearCost: "Costo de Desgaste:",
    wearTearRate: "@ $0.035/kWh ciclado",
    stateOfHealth: "SoH",

    // Forecaster
    forecastTitle: "Pronosticador Continuo de 6 Horas",
    forecastSubtitle: "Series temporales multivariables P10/P50/P90 • Intervalos de 15 min",
    demandP50: "Demanda (P50)",
    solarP50: "Solar FV (P50)",
    tariffRate: "Tarifa ($/kWh)",
    bandsP10P90: "Bandas P10-P90",
    stepTime: "Paso:",

    // Dispatch Matrix
    scheduleTitle: "Programa Óptimo de Despacho",
    scheduleSubtitle: "Decisiones de programación lineal en 24 intervalos",
    filterAll: "TODOS",
    filterPeak: "PICOS",
    filterStorage: "BATERÍA",
    filterExport: "EXPORT",
    colInterval: "Intervalo",
    colDemand: "Demanda",
    colSolar: "Solar",
    colBess: "Potencia BESS",
    colGrid: "Flujo Red",
    colSoc: "SoC",
    colTariff: "Tarifa",
    colDecision: "Decisión",
    actionPeakShaving: "Recorte Picos",
    actionStoreSolar: "Guardar Solar",
    actionCleanExport: "Exportar Limpio",
    actionIslandedSupport: "Soporte Aislado",
    actionForceCharge: "Carga Forzada",
    actionSelfConsume: "Autoconsumo",
    rationaleLabel: "Fundamento Técnico:",
    stepCost: "Costo Paso:",
    baselineCost: "Base:",
    savedLabel: "Ahorro",

    // Economic Impact
    impactTitle: "Retorno Económico e Impacto de Carbono",
    impactSubtitle: "Optimización GreenSync vs Red Tradicional",
    rollingHorizonLabel: "Horizonte de 6 Horas",
    netSavings: "Ahorro Financiero Neto",
    vsUnmanaged: "vs importación sin optimizar",
    carbonAbated: "Emisiones CO₂ Evitadas",
    gridDisplacement: "0.71 kg/kWh desplazado",
    optimizedCost: "Costo Optimizado",
    inclWear: "incl. desgaste batería",
    unmanagedBaseline: "Costo Tradicional",
    netDeficitGrid: "100% compra a la red",
    expenseComparison: "Comparativa de Gasto:",
    payingPercentage: "GreenSync paga sólo",

    // What-If Simulator
    whatIfTitle: "Simulador Interactivo de Escenarios",
    whatIfSubtitle: "Pruebas de estrés ante cambios climáticos y fallas de red",
    scenCloudTitle: "Nubosidad Severa (88%)",
    scenCloudDesc: "Simula caída del 80% de radiación solar; prueba descarga BESS.",
    scenGridTitle: "Corte de Red Eléctrica",
    scenGridDesc: "El interruptor PCC abre; activa modo isla sin interrupción.",
    scenSurgeTitle: "Pico de Carga Industrial (+130 kW)",
    scenSurgeDesc: "Arranque de motores pesados; evalúa recorte de picos.",
    scenResetTitle: "Restablecer Base",
    scenResetDesc: "Cierra todos los interruptores y regresa a operación nominal.",

    // SCADA Controls
    controlsTitle: "Controles de Supervisión SCADA",
    controlsSubtitle: "Modos de Operación IEEE 2030.7 e Interruptores ANSI",
    auditLogBtn: "Registro Auditoría",
    operatingModeLabel: "Modo del Controlador de Microred:",
    ansiBreakersLabel: "Interruptores de Dispositivo ANSI:",
    solarInverterTrip: "Inversor Solar",
    bessStorageTrip: "Inversor Batería",
    gridUtilityTie: "Enlace Red Principal",
  },
};
