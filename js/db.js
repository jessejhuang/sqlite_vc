 class Database{

	constructor(){
		this.directoryColumns = [
			'name', 'entity_type', 'homepage_url', 'logo_url', 'city',
			'description', 'short_description', 'overview',
			'cb_objects.id', 'cb_objects.status',
			'founded_at', 'cb_funding_rounds.funded_at',
			'first_funding_at', 'last_funding_at',
			'funding_total_usd', 
			'cb_funding_rounds.raised_amount_usd',
			'cb_funding_rounds.funding_round_type', 'cb_objects.category_code'
		];
		this.db = new Promise((resolve, reject) => {
			d3.request('data/raw_crunchbase.db')
			//d3.request('https://rawcrunchbasedb.blob.core.windows.net/raw/raw_crunchbase.db?sp=r&st=2018-12-16T02:31:46Z&se=2019-01-03T10:31:46Z&sip=0.0.0.0-255.255.255.255&spr=https&sv=2018-03-28&sig=ozV5CpPZKudt4iEcPs%2BsnrlRTm7feTQ0ysiuBVWh0hY%3D&sr=b')
				.header("X-Requested-With", "XMLHttpRequest")
				.header('Access-Control-Allow-Origin', '*')
				.header('Access-Control-Allow-Methods' ,'GET, POST')
				.responseType('arraybuffer')
				.get((err, data) => {
					if(err){
						reject(err);
					}
					const database = new SQL.Database(new Uint8Array(data.response));
					resolve(database);
				});
		});
	}

	processQuery(query, formatFunction){
		let self = this;
		return new Promise((resolve, reject) => {
			self.db.then(database => {
				//console.log('Process Query: ');
				//console.log(query);
				let response = database.exec(query);
				if (formatFunction){
					resolve(formatFunction(response));
				}
				else{
					resolve(response);
				}
			}, err => {
				reject(err);
			});
		});
	}

	mapQuery(funding_round_type, category_code, city=null){
		// Always select these fields
  
		if (funding_round_type[0]== '') {
		funding_round_type = [];
		}
		if (category_code[0] == '') { 
				category_code = [];
			}

		if(funding_round_type.length == 0){
		funding_round_type = 'IS NOT NULL';
		}
		else if(funding_round_type.length == 1){
   
			funding_round_type = `IN (\'${funding_round_type[0]}\')`;
   
		} else{
			funding_round_type = funding_round_type.map(round => `\'${round}\'`);
			funding_round_type = `IN (${funding_round_type.join(', ')})`;
		}
  
		if(category_code.length == 0){
		category_code = 'IS NOT NULL';
		}
		else if(category_code.length == 1){
   
			category_code = `IN (\'${category_code[0]}\')`;
   
		} else{
			category_code = category_code.map(code => `\'${code}\'`);
			category_code = `IN (${category_code.join(', ')})`;
		}
 
  
		let query = `
			SELECT
				cb_objects_venture.city,
				cb_funding_rounds.raised_amount,
				cb_funding_rounds.funded_at as year `;
		// Additional fields to select if specified
		if(funding_round_type){
			query += ', cb_funding_rounds.funding_round_type ';
		}
		if(category_code){
			query += ', cb_objects_venture.category_code ';
		}

		// Always merge these tables together
		query +=	`
			FROM cb_investments
			INNER JOIN cb_funding_rounds ON cb_investments.funding_round_id=cb_funding_rounds.id
			INNER JOIN cb_objects as cb_objects_venture ON cb_investments.funded_object_id=cb_objects_venture.id
			INNER JOIN cb_objects as cb_objects_vc ON cb_investments.investor_object_id=cb_objects_vc.id `;
		// Filter
		if(funding_round_type || category_code){
			query += 'WHERE ';
			if(funding_round_type){
				query += `(cb_funding_rounds.funding_round_type ${funding_round_type}) `;
			}
			if(funding_round_type && category_code){
				query += 'AND ';
			}
			if(category_code){
				query += ` (cb_objects_venture.category_code ${category_code}) `;
			}
		}
		// Grouping must align with selection
		query += 'GROUP BY cb_objects_venture.city, year ';
	
		if(funding_round_type){
			query += ', cb_funding_rounds.funding_round_type';
		}
		if(category_code){
			query += ', cb_objects_venture.category_code ';
		}
		//Sort
		query += ' ORDER BY cb_objects_venture.city, year';
		query += ';';
		// console.log("map query")
  		// console.log(query);
		return query;
	}

	// Takes in a proxy object from a sqlalchemy query that contains data to be used in the map.
	// Formats it into the form {"San Francisco": {"1987": 0, "1995": 0, "1996": 0...
	formatMapData(res){
		let data = res[0].values;
		let cities = {};
		for(let element of data){
			let city = element[0];
			let raised = element[1];
			let date = element[2];
			if(city && date){
				city = city.toLowerCase();
				let words = city.split(' ');
				for(let i = 0; i < words.length; i++){
					words[i] = words[i].charAt(0).toUpperCase() + words[i].substr(1);
				}
				city = words.join(' ');
				let year = date.match(/\d+/g)[0];
				if(!cities[city]){
					cities[city] = {};
				}
				if(!cities[city][year]){
					cities[city][year] = 0;
				}
				cities[city][year] += raised;
			}
		}
		return cities;
	}

	lineQuery(funding_round_type=[], category_code=[], city='None', operation="SUM") {
  
		if (funding_round_type[0]== '') {
			funding_round_type = [];
		}
		if (category_code[0] == '') { 
			category_code = [];
		}

		//console.log(funding_round_type);
		//console.log(category_code);
  
		let processFundingRound =true;
		let processCategoryCode =true;

		if (funding_round_type.length == 0) {
			processFundingRound=false;
		}
		if (category_code.length == 0) { 
			processCategoryCode=false;
		}

		let query = "";

		//  Nested query
		query += "SELECT " + operation + "(raised_amount), strftime(\'%Y\', t.funded_at) as 'year'"

		if (processFundingRound) {
			query += ", funding_round_type"
		}
		if (processCategoryCode) { 
			query += ", category_code"
		}

		query += "\n FROM \n ("

		//  Inner query
		//  query += 'SELECT DISTINCT cb_objects_venture.name, cb_funding_rounds.funded_at, \
				//  cb_funding_rounds.raised_amount' 

		query += 'SELECT DISTINCT cb_objects_venture.name, cb_objects_venture.city, \
				cb_funding_rounds.raised_amount, cb_funding_rounds.funded_at'

		if (processFundingRound) {
			query += ", cb_funding_rounds.funding_round_type"
		}
		if (processCategoryCode) { 
			query += ", cb_objects_venture.category_code"
		}

		//  Joining
		query+=	'\nFROM cb_investments \n \
			INNER JOIN cb_funding_rounds ON cb_investments.funding_round_id=cb_funding_rounds.id \n \
			INNER JOIN cb_objects as cb_objects_venture ON cb_investments.funded_object_id=cb_objects_venture.id \n \
			INNER JOIN cb_objects as cb_objects_vc ON cb_investments.investor_object_id=cb_objects_vc.id'

		//  Filtering
		if (processFundingRound || processCategoryCode) {
			query += '\nWHERE \n (cb_objects_venture.country_code=\'USA\') \n AND \n (cb_objects_venture.state_code!=\'None\')'
		}

		if (city == "None") {
			query += "\n AND \n(cb_objects_venture.city != \'None\')"
		} else {
			query += "\n AND \n(cb_objects_venture.city == \'" + city + "\')"
		}

		if (processFundingRound || processCategoryCode) {
			query += '\n AND'
		}

		if (processFundingRound) {
			query += '\n (cb_funding_rounds.funding_round_type IN (';

			for (let i=0; i < funding_round_type.length; i++) {
				query += "\'" + funding_round_type[i] + "\'"

				if (i < funding_round_type.length-1) {
					query += ','
				}
			}

			query += '))';
		}

		if (processFundingRound && processCategoryCode) {
			query += '\n AND'
		}


		if (processCategoryCode) {
			query += '\n (cb_objects_venture.category_code IN ('

			for (let i=0; i < category_code.length; i++) {
				query += "\'" + category_code[i] + "\'"

				if (i < category_code.length-1) {
					query += ','
				}
			}
			query += '))';

		}

		//  End nested query
		query += '\n ) t '

		//  Grouping must align with selection
		query += '\nGROUP BY year'

		if (processFundingRound) {
			query += ", funding_round_type"
		}
		if (processCategoryCode) { 
			query += ", category_code"
		}

		//  Sort
		query += '\nORDER BY ' 

		if (processFundingRound) {
			query += "funding_round_type, ";
		}
		if (processCategoryCode) { 
			query += "category_code, ";
		}

		query += ' year';

		//  Finish
		query += ";";
		// console.log("Line query")
		// console.log(query);
		return(query);
	}


	formatLineData(res) {
		// console.log("\n\n\n\n\nres");
		// console.log(res);
		// console.log(res['0']['columns'].length)
		// console.log(Object.keys(res));
		let lines = new Object();
		let curLine = [];
		let dataPoint;
		let curCat;
		let curFund;
		let curName;
		let nextName;

		if (res['0']['columns'].length==2) { curName = "Total"; }
		if (res['0']['columns'].length==3) { curName = res['0']['values'][0][2]; }
		if (res['0']['columns'].length==4) { curName = res['0']['values'][0][2] + ", " + res['0']['values'][0][3]; }

		// console.log(curName);
		// Process lines one by one (1 for each funding type category type combination)
		for (let i=0; i < res['0']['values'].length; i++) {
			// Update current name of line being processed
			if (res['0']['columns'].length==2) { nextName = "Total"; }
			if (res['0']['columns'].length==3) { nextName = res['0']['values'][i][2]; }
			if (res['0']['columns'].length==4) { nextName = res['0']['values'][i][2] + ", " + res['0']['values'][i][3]; }

			// We're starting a new line
			if ( (curName != nextName) ) {
				// Finish up old line
				lines[curName] = curLine;
				curLine = [];
				curName = nextName;
			}

			dataPoint = new Object();
			dataPoint.amount  = "" + res['0']['values'][i][0];
			dataPoint.year = parseInt(res['0']['values'][i][1]);
			curLine.push(dataPoint);

			// the last line
			if (i==res['0']['values'].length-1) {
				lines[curName] = curLine;
			}
		}

		lines = JSON.stringify(lines)
		// console.log(lines);
		// return("ay")
		return(lines);
	}


	filtersQuery(field, table){
		return `SELECT ${field} FROM ${table} GROUP BY ${field}`;
	}

	formatFilterData(res){
		let filters = [];
		let data = res[0].values;
		for(let element of data){
			filters.push(element[0]);
		}
		return filters;
	}




	directoryQuery(years, cities, funding_round_types, category_codes){
		// console.log("cities");
		// console.log(cities);
		let query = '';
		query += 'SELECT funded_at, funded_object.name, investor_object.name, funded_object.category_code, cb_funding_rounds.raised_amount_usd, funded_object.state_code, funded_object.city, cb_funding_rounds.funding_round_type'
		
		// Join necessary tables
		query += "\nFROM cb_investments"
		query += '\nINNER JOIN cb_funding_rounds on cb_investments.funding_round_id=cb_funding_rounds.id'
		query += '\nINNER JOIN cb_objects as funded_object on cb_investments.funded_object_id=funded_object.id'
		query += '\nINNER JOIN cb_objects as investor_object on cb_investments.investor_object_id=investor_object.id'

		// Filters
		query += "\nWHERE\n(funded_object.country_code==\"USA\")"

		// Years
		if (years.length>0) {
			query += "\nAND\nSTRFTIME('%Y', cb_funding_rounds.funded_at) in ("

			for (let i=0; i < years.length; i++) {
				query += "\'" + years[i] + "\'"
				if (i < years.length-1) {
					query += ", "
				}
			}
			query += ")"
		}

		// Cities
		if (cities.length>0 && cities[0]!='') {
			// cities = cities[0];
			query += "\nAND\nfunded_object.city in ("

			for (let i=0; i < cities.length; i++) {
				// console.log("next city");
				// console.log(cities[i]);
				query += "\'" + cities[i] + "\'"
				if (i < cities.length-1) {
					query += ", "
				}
			}
			query += ")"
		}

		// Funding round types
		if (funding_round_types.length>0 && funding_round_types[0]!='') {
			// funding_round_types = funding_round_types[0];
			query += "\nAND\ncb_funding_rounds.funding_round_type in ("

			for (let i=0; i < funding_round_types.length; i++) {
				query += "\'" + funding_round_types[i] + "\'"
				if (i < funding_round_types.length-1) {
					query += ", "
				}
			}
			query += ")"
		}

		// Category codes
		if (category_codes.length>0 && category_codes[0]!='') {
			// category_codes = category_codes[0];
			query += "\nAND\nfunded_object.category_code in ("

			for (let i=0; i < category_codes.length; i++) {
				query += "\'" + category_codes[i] + "\'"
				if (i < category_codes.length-1) {
					query += ", "
				}
			}
			query += ")"
		}

		query += "\ORDER BY cb_funding_rounds.raised_amount_usd DESC, funded_at DESC;"

		// console.log("dir query");
		// console.log(query);
		return query;
	}



	formatDirectoryData(res){
		let columnNames = ["Funded at", "Funded entity", "Investor", "Category", "Raised amount", "State", "City", "Funding round"]

		let processedData = [];
		// console.log("res");
		// console.log(res);
		let data = res['0']['values'];
		let nextDataPoint;
		let nextDict;

		// Loop through values...each value represents a transaction
		for (let j = 0; j < data.length; j++) {
			nextDataPoint = data[j]
			nextDict = new Object();
			// Loop through each column 
			for (let i = 0; i < columnNames.length; i++) {
				nextDict[columnNames[i]] = nextDataPoint[i];
			}
			processedData.push(nextDict);
		}
		// console.log(processedData)
		return(processedData)
	}




	linkQuery(yearMin,yearMax, cities, funding_round_types, category_codes, network_type){
		if(cities.length == 1){
			cities = `(\'${cities[0]}\')`;
		} else{
			cities = cities.map(city => `\'${city}\'`);
			cities = `(${cities.join(', ')})`;
		}
  
  if (funding_round_types[0]== '') {
		funding_round_types = [];
		}
		if (category_codes[0] == '') { 
				category_codes = [];
			}

		if(funding_round_types.length == 0){
		funding_round_types = 'IS NOT NULL';
		}
		else if(funding_round_types.length == 1){
   
			funding_round_types = `IN (\'${funding_round_types[0]}\')`;
   
		} else{
			funding_round_types = funding_round_types.map(round => `\'${round}\'`);
			funding_round_types = `IN (${funding_round_types.join(', ')})`;
		}
  
		if(category_codes.length == 0){
		category_codes = 'IS NOT NULL';
		}
		else if(category_codes.length == 1){
   
			category_codes = `IN (\'${category_codes[0]}\')`;
   
		} else{
			category_codes = category_codes.map(code => `\'${code}\'`);
			category_codes = `IN (${category_codes.join(', ')})`;
		}

		let query = `
			SELECT t.source, t.target, CAST(t.raised_amount as TEXT) as raised_amount FROM \
				(SELECT cb_investments.investor_object_id, cb_investments.funded_object_id, \
				 SUM(cb_funding_rounds.raised_amount) as raised_amount, \
			STRFTIME('%Y', cb_funding_rounds.funded_at) as year, \
			cb_objects_vc.name as source, cb_objects_venture.name as target \
			FROM cb_investments \
			INNER JOIN cb_funding_rounds ON cb_investments.funding_round_id=cb_funding_rounds.id  \
			INNER JOIN cb_objects as cb_objects_venture ON cb_investments.funded_object_id=cb_objects_venture.id  \
			INNER JOIN cb_objects as cb_objects_vc ON cb_investments.investor_object_id=cb_objects_vc.id \
		`;
		if(network_type === 'city' || !network_type){
			query += `
				WHERE (cb_objects_venture.city IN ${cities}) AND \
				(STRFTIME('%Y', cb_funding_rounds.funded_at) BETWEEN \'${yearMin}\' AND \'${yearMax}\')
			`;
   if(funding_round_types){
				query += ` AND (cb_funding_rounds.funding_round_type ${funding_round_types}) `;
			}
			if(category_codes){
				query += ` AND (cb_objects_venture.category_code ${category_codes}) `;
			}
		}
		else if(network_type === 'vc'){
			console.log('link query: vc network');
		}
		else if(network_type === 'venture'){
			console.log('link query: venture network');
		}
		else{
			console.log('link query: invalid network type');
		}
		query += `
			AND raised_amount != 0
			GROUP BY cb_investments.funded_object_id, cb_investments.investor_object_id, cb_funding_rounds.funded_at
			ORDER BY raised_amount DESC) t LIMIT 40
		`;
		return query;
		
	}

	formatLinkData(res){
		//console.log('format link data:', res);
		var data = [];
		if(res[0] !== undefined){
			data = res[0].values;
		}
		let links = [];
		let rows = [];
		for(let element of data){
			rows.push(element);
			let formatted_row = {
				source: element[0],
				target: element[1],
				amount: element[2]
			};
			links.push(formatted_row);
		}
		//console.log('format link data raw link: ', rows);
		//console.log('format link data: links: ', links);
		return links;
	}

	nodeQuery(linkQuery){
		let query = `
			SELECT DISTINCT t.source, \"vc\" as type	
			FROM (${linkQuery}) t
			UNION SELECT DISTINCT t.target, \"venture\" as type
			FROM (${linkQuery}) t
			ORDER BY type
		`;
		return query;
	}

	formatNodeData(res){
		var data = [];
		if(res[0] !== undefined){
			data = res[0].values;
		}
		let nodes = [];
		for(let element of data){
			let formatted_row = {
				name: element[0],
				type: element[1]
			};
			nodes.push(formatted_row);
		}
		//console.log('Format Node Data nodes: ', nodes);
		return nodes;
	}

	profileQuery(name){
		let profileColumns = [
			'name', 'entity_type', 'homepage_url', 'logo_url', 'city',
			'description', 'short_description', 'overview',
			'cb_objects.status',
			'founded_at', 'cb_funding_rounds.funded_at',
			'first_funding_at', 'last_funding_at',
			'funding_total_usd', 
			'cb_funding_rounds.raised_amount_usd',
			'cb_funding_rounds.funding_round_type', 'cb_objects.category_code'
		];
		let crunchBaseVCTypes = ['FinancialOrg', 'People'];
		let crunchBaseVentureTypes = ['Company'];
		let crunchbaseTypes = crunchBaseVCTypes.concat(crunchBaseVentureTypes);
		let query = '';
		for(let i = 0; i < crunchbaseTypes.length; i++){
			query += 'SELECT DISTINCT';
			for(let j = 0; j < profileColumns.length; j++){
				query += ` ${profileColumns[j]}`;
				if(j !== profileColumns.length - 1){
					query += ', ';
				}
			}
			query += ' FROM cb_objects';
			if(crunchBaseVentureTypes.includes(crunchbaseTypes[i])){
				query += ' INNER JOIN cb_investments on cb_investments.funded_object_id=cb_objects.id ';
			}
			else if(crunchBaseVCTypes.includes(crunchbaseTypes[i])){
				query += ' INNER JOIN cb_investments on cb_investments.investor_object_id=cb_objects.id ';
			}
			query += ' INNER JOIN cb_funding_rounds on cb_investments.funding_round_id=cb_funding_rounds.id ';
			query += `
				WHERE (name='${name}')	
			`;
			if(i != crunchbaseTypes.length - 1){
				query += ' UNION ';
			}
		}
		query += ';';
		return query;
	}

	formatProfileData(res){
		let profileColumns = [
			'name', 'entity_type', 'homepage_url', 'logo_url', 'city',
			'description', 'short_description', 'overview',
			'cb_objects.status',
			'founded_at', 'cb_funding_rounds.funded_at',
			'first_funding_at', 'last_funding_at',
			'funding_total_usd', 
			'cb_funding_rounds.raised_amount_usd',
			'cb_funding_rounds.funding_round_type', 'cb_objects.category_code'
		];
		let fundIndex = profileColumns.findIndex(d => d === 'cb_funding_rounds.raised_amount_usd');
		let dateIndex = profileColumns.findIndex(d => d === 'cb_funding_rounds.funded_at');
		let typeIndex = profileColumns.findIndex(d => d === 'cb_funding_rounds.funding_round_type');
		let data = [];
		if(res[0] !== undefined){
			data = res[0].values;
		}
		let companyInfo = {};
		companyInfo['history'] = [];
		for(let i = 0; i < data.length; i++){
			if(i === 0){
				for(let j = 0; j < profileColumns.length; j++){
					if(j !== fundIndex && j !== dateIndex && j !== typeIndex){
						companyInfo[profileColumns[j]] = data[i][j];
					}
				}
			}
			companyInfo['history'].push({
				date: data[i][dateIndex],
				amount: data[i][fundIndex],
				funding_type: data[i][typeIndex]
			});
		}
		console.log('format Profile data: ', companyInfo);
		return companyInfo;
	}

}