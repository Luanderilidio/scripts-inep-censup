function doGet(e) {
  if (!e || !e.parameter) {
    return ContentService.createTextOutput(JSON.stringify({error: 'No parameters provided'})).setMimeType(ContentService.MimeType.JSON);
  }
  
  var action = e.parameter.action;

  var course = e.parameter.course || null;
  var city = e.parameter.city || null;
  var modality = e.parameter.modality || null;
  var degree = e.parameter.degree || null;

  if (action === 'getAll') {
      var allData = getAllData();
      return ContentService.createTextOutput(JSON.stringify(allData)).setMimeType(ContentService.MimeType.JSON);
  } else if (action === 'getFiltered') {  
      var data = getFilteredData(course, city, modality, degree);
      var cards = createCards(data);
      var horizontalBar = getHorizontalBar(course, city, modality, degree)
      var lineChart = getFilteredDataByRace(course, city, modality, degree)
      var funnelChart = getTotalFaixaEtariaIngressantes(course, city, modality, degree)
      var barVertical = getTotalIngressantesPorGenero(course, city, modality, degree);
      var data = [
        {cards: cards},
        {horizontalBar: horizontalBar},
        {lineChart: lineChart},
        {funnelChart: funnelChart},
        {barVertical: barVertical}
      ]
      return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  } else {
    return ContentService.createTextOutput(JSON.stringify({error: 'error'})).setMimeType(ContentService.MimeType.JSON);
  }
}

function getFilteredData(courseName, cityName, modality, degree) {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName('microdados');
  var values = sheet.getDataRange().getValues();

  
  var aggregatedData = {
    qt_vg_total: {},
    qt_inscrito_total: {},
    qt_ing: {},
    qt_conc: {}
  };

  
  for (var i = 1; i < values.length; i++) {
    var currentYear = values[i][0];  
    var currentCourse = values[i][2];  
    var currentCity = values[i][1];    
    var currentModality = values[i][6];
    var currentDegree = values[i][7];
    var qt_vg_total = values[i][9];  
    var qt_inscrito_total = values[i][17]; 
    var qt_ing = values[i][25]; 
    var qt_conc = values[i][74]; 

    if ((!courseName || currentCourse === courseName) &&
        (!cityName || currentCity === cityName) &&
        (!modality || currentModality === modality) &&
        (!degree || currentDegree === degree)) {

      
      if (!aggregatedData.qt_vg_total[currentYear]) {
        aggregatedData.qt_vg_total[currentYear] = 0;
        aggregatedData.qt_inscrito_total[currentYear] = 0;
        aggregatedData.qt_ing[currentYear] = 0;
        aggregatedData.qt_conc[currentYear] = 0;
      }
      aggregatedData.qt_vg_total[currentYear] += qt_vg_total;
      aggregatedData.qt_inscrito_total[currentYear] += qt_inscrito_total;
      aggregatedData.qt_ing[currentYear] += qt_ing;
      aggregatedData.qt_conc[currentYear] += qt_conc;
    }
  }

  return aggregatedData;
}


function createCards(data) {
  var cards = [
    createCard("Quantidade Total de Vagas", data.qt_vg_total),
    createCard("Quantidade Total Inscritos", data.qt_inscrito_total),
    createCard("Quantidade de Ingressantes", data.qt_ing),
    createCard("Quantidade de Concluintes", data.qt_conc)
  ];

  return cards;
}

function createCard(title, dataByYear) {
  
  var dataArray = Object.keys(dataByYear).map(function(year) {
    return {
      ano: parseInt(year),
      quantidade: dataByYear[year]
    };
  });

  dataArray.sort(function(a, b) {
    return a.ano - b.ano;
  });

  return {
    title: title,
    qtd: dataArray.reduce(function(sum, entry) {
      return sum + entry.quantidade;
    }, 0),
    data: dataArray
  };
}

function testGetFilteredDocuments() {
  var course = "COMPUTACAO";  
  var city =  null;      
  var modality = null;           
  var degree = null;              

  
  var totalVagas = getFilteredData(course, city, modality, degree);

  Logger.log("Total de Vagas: " + totalVagas);  
}

function getHorizontalBar(courseName, cityName, modality, degree) {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName('microdados');
  var values = sheet.getDataRange().getValues();

  
  var total_qt_ing_reserva_vaga = 0;
  var total_qt_ing_rvredepublica = 0;
  var total_qt_ing_rvetnico = 0;
  var total_qt_ing_rvsocial_rf = 0;
  var total_qt_ing_deficiente = 0;
  var total_qt_ing_rvoutros = 0;

  
  for (var i = 1; i < values.length; i++) {

    var currentCourse = values[i][2];  
    var currentCity = values[i][1];    
    var currentModality = values[i][6];
    var currentDegree = values[i][7];  

    if ((!courseName || currentCourse === courseName) &&
        (!cityName || currentCity === cityName) &&
        (!modality || currentModality === modality) &&
        (!degree || currentDegree === degree)) { 

        total_qt_ing_reserva_vaga += values[i][99] || 0;
        total_qt_ing_rvredepublica += values[i][100] || 0;
        total_qt_ing_rvetnico += values[i][101] || 0;
        total_qt_ing_rvsocial_rf += values[i][103] || 0;
        total_qt_ing_deficiente += values[i][93] || 0;
        total_qt_ing_rvoutros += values[i][104] || 0;
        
    }
  }

 
  var dataArray = {
    name: "Ingressantes",
    data: [
      total_qt_ing_reserva_vaga,
      total_qt_ing_rvredepublica,
      total_qt_ing_rvetnico,
      total_qt_ing_rvsocial_rf,
      total_qt_ing_deficiente,
      total_qt_ing_rvoutros
    ]
  };

  
  return dataArray
}

function getFilteredDataByRace(courseName, cityName, modality, degree) {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName('microdados');
  var values = sheet.getDataRange().getValues();
  
 
  const series = [
    { name: "Branca", hidden: false, data: [], total: 0 },
    { name: "Negra", hidden: false, data: [], total: 0 },
    { name: "Parda", hidden: false, data: [], total: 0 },
    { name: "Amarela", hidden: true, data: [], total: 0 },
    { name: "Indígena", hidden: true, data: [], total: 0 },
    { name: "N/ Declarado", hidden: true, data: [], total: 0 }
  ];

  
  var aggregatedData = {
    branca: {},
    preta: {},
    parda: {},
    amarela: {},
    indigena: {},
    cornd: {}
  };

  
  for (var i = 1; i < values.length; i++) {
    var currentYear = values[i][0];  
    var currentCourse = values[i][2];  
    var currentCity = values[i][1];    
    var currentModality = values[i][6];
    var currentDegree = values[i][7];  
    
    
    var qt_ing_branca = values[i][49];  
    var qt_ing_preta = values[i][50];   
    var qt_ing_parda = values[i][51];   
    var qt_ing_amarela = values[i][52]; 
    var qt_ing_indigena = values[i][53];
    var qt_ing_cornd = values[i][54];

    
    if ((!courseName || currentCourse === courseName) &&
        (!cityName || currentCity === cityName) &&
        (!modality || currentModality === modality) &&
        (!degree || currentDegree === degree)) {

      // Agrega os dados por ano
      if (!aggregatedData.branca[currentYear]) {
        aggregatedData.branca[currentYear] = 0;
        aggregatedData.preta[currentYear] = 0;
        aggregatedData.parda[currentYear] = 0;
        aggregatedData.amarela[currentYear] = 0;
        aggregatedData.indigena[currentYear] = 0;
        aggregatedData.cornd[currentYear] = 0;
      }

  
      aggregatedData.branca[currentYear] += qt_ing_branca;
      aggregatedData.preta[currentYear] += qt_ing_preta;
      aggregatedData.parda[currentYear] += qt_ing_parda;
      aggregatedData.amarela[currentYear] += qt_ing_amarela;
      aggregatedData.indigena[currentYear] += qt_ing_indigena;
      aggregatedData.cornd[currentYear] += qt_ing_cornd;
    }
  }

  
  var anos = Object.keys(aggregatedData.branca).sort();
  
  anos.forEach(function(ano) {
    
    series[0].data.push(aggregatedData.branca[ano]);   
    series[1].data.push(aggregatedData.preta[ano]);    
    series[2].data.push(aggregatedData.parda[ano]);    
    series[3].data.push(aggregatedData.amarela[ano]);  
    series[4].data.push(aggregatedData.indigena[ano]); 
    series[5].data.push(aggregatedData.cornd[ano]);    
  });

  
  series.forEach(function(serie) {
    serie.total = serie.data.reduce((sum, value) => sum + value, 0);
  });

  
  Logger.log(JSON.stringify(series));
  return series;
}

function getTotalFaixaEtariaIngressantes(courseName, cityName, modality, degree) {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName('microdados');
  var values = sheet.getDataRange().getValues();
  
  
  const series = [
    {
      name: "ingressantes",
      data: []
    }
  ];

  
  var total_0_17 = 0;
  var total_18_24 = 0;
  var total_25_29 = 0;
  var total_30_34 = 0;
  var total_35_39 = 0;
  var total_40_49 = 0;
  var total_50_59 = 0;
  var total_60_mais = 0;

  
  for (var i = 1; i < values.length; i++) {
    var currentCourse = values[i][2];  
    var currentCity = values[i][1];   
    var currentModality = values[i][6];
    var currentDegree = values[i][7];  

    
    var qt_ing_0_17 = values[i][41];  
    var qt_ing_18_24 = values[i][42];  
    var qt_ing_25_29 = values[i][43];  
    var qt_ing_30_34 = values[i][44];  
    var qt_ing_35_39 = values[i][45];  
    var qt_ing_40_49 = values[i][46];  
    var qt_ing_50_59 = values[i][47];  
    var qt_ing_60_mais = values[i][48];

  
    if ((!courseName || currentCourse === courseName) &&
        (!cityName || currentCity === cityName) &&
        (!modality || currentModality === modality) &&
        (!degree || currentDegree === degree)) {

  
      total_0_17 += qt_ing_0_17;
      total_18_24 += qt_ing_18_24;
      total_25_29 += qt_ing_25_29;
      total_30_34 += qt_ing_30_34;
      total_35_39 += qt_ing_35_39;
      total_40_49 += qt_ing_40_49;
      total_50_59 += qt_ing_50_59;
      total_60_mais += qt_ing_60_mais;
    }
  }

  
  series[0].data.push(total_0_17);
  series[0].data.push(total_18_24);
  series[0].data.push(total_25_29);
  series[0].data.push(total_30_34);
  series[0].data.push(total_35_39);
  series[0].data.push(total_40_49);
  series[0].data.push(total_50_59);
  series[0].data.push(total_60_mais);


  
  Logger.log(JSON.stringify(series));
  return series;
}

function getTotalIngressantesPorGenero(courseName, cityName, modality, degree) {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName('microdados');
  var values = sheet.getDataRange().getValues();
  
  
  const series = [
    {
      name: "Masculino",
      hidden: false,
      data: []
    },
    {
      name: "Feminino",
      hidden: true,
      data: []
    }
  ];

  
  var totalMasculinoPorAno = {};
  var totalFemininoPorAno = {};

  
  for (var i = 1; i < values.length; i++) {
    var currentYear = values[i][0];  
    var currentCourse = values[i][2];  
    var currentCity = values[i][1];    
    var currentModality = values[i][6];
    var currentDegree = values[i][7];
    
  
    var qt_ing_fem = values[i][26];  
    var qt_ing_masc = values[i][27];

  
    if ((!courseName || currentCourse === courseName) &&
        (!cityName || currentCity === cityName) &&
        (!modality || currentModality === modality) &&
        (!degree || currentDegree === degree)) {

  
      if (!totalMasculinoPorAno[currentYear]) {
        totalMasculinoPorAno[currentYear] = 0;
        totalFemininoPorAno[currentYear] = 0;
      }

  
      totalMasculinoPorAno[currentYear] += qt_ing_masc;
      totalFemininoPorAno[currentYear] += qt_ing_fem;
    }
  }

  
  var anos = Object.keys(totalMasculinoPorAno).sort();

  anos.forEach(function(ano) {
    series[0].data.push(totalMasculinoPorAno[ano]);  
    series[1].data.push(totalFemininoPorAno[ano]);   
  });

  
  Logger.log(JSON.stringify(series));
  return series;
}




