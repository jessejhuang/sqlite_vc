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

	mapQuery(funding_round_type, category_code, limit){
		// Always select these fields
  
  if(funding_round_type.length == 1){
			funding_round_type = `IN (\'${funding_round_type[0]}\')`;
		} else{
			funding_round_type = funding_round_type.map(round => `\'${round}\'`);
			funding_round_type = `IN (${funding_round_type.join(', ')})`;
		}
  
  if(category_code.length == 1){
			category_code = `IN (\'${category_code[0]}\')`;
		} else{
			category_code = category_code.map(code => `\'${code}\'`);
			category_code = `IN (${category_code.join(', ')})`;
		}
  
  if (funding_round_type==="IN ('total')") {
			funding_round_type = 'IS NOT NULL';
		}
		if (category_code==="IN ('total')") { 
			category_code = 'IS NOT NULL';
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
		if(limit){
			query += `LIMIT ${limit}`;
		}
		query += ';';
  
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

	lineQuery(funding_round_type=['total'], category_code=['total']) {
  
  console.log(funding_round_type);
  console.log(category_code);
  
		let processFundingRound =true;
		let processCategoryCode =true;

		if (funding_round_type[0]=='total') {
			processFundingRound=false;
		}
		if (category_code[0]=='total') { 
			processCategoryCode=false;
		}

		let query = "";

		//  Nested query
		query += "SELECT SUM(raised_amount), strftime(\'%Y\', t.funded_at) as 'year'"

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
  console.log(query);
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

	directoryQuery(year, cities, funding_round_type, category_code, limit){
		// Retrieve info for list of entities
		let self = this;
		if(cities.length == 1){
			cities = `(\'${cities[0]}\')`;
		} else{
			cities = cities.map(city => `\'${city}\'`);
			cities = `(${cities.join(', ')})`;
		}
		let crunchBaseVCTypes = ['FinancialOrg', 'People'];
		let crunchBaseVentureTypes = ['Company'];
		let crunchbaseTypes = crunchBaseVCTypes.concat(crunchBaseVentureTypes);
		let query = '';
		for(let i = 0; i < crunchbaseTypes.length; i++){
			query += 'SELECT DISTINCT';
			for(let j = 0; j < self.directoryColumns.length; j++){
				query += ` ${self.directoryColumns[j]}`;
				if(j !== self.directoryColumns.length - 1){
					query += ', ';
				}
			}
			query += ' FROM cb_objects';
			if(crunchBaseVentureTypes.includes(crunchbaseTypes[i])){
				query += ' INNER JOIN cb_investments on cb_investments.funded_object_id=cb_objects.id ';
			}
			if(crunchBaseVCTypes.includes(crunchbaseTypes[i])){
				query += ' INNER JOIN cb_investments on cb_investments.investor_object_id=cb_objects.id ';
			}
			query += ' INNER JOIN cb_funding_rounds on cb_investments.funding_round_id=cb_funding_rounds.id ';
			query += `
				WHERE (entity_type='${crunchbaseTypes[i]}') AND	
				(city IN ${cities}) AND
				(STRFTIME(\'%Y\', cb_funding_rounds.funded_at)=\'${year}\')
			`;
			if(funding_round_type){
				query += `
					AND (cb_funding_rounds.funding_round_type='${funding_round_type}')
				`;
			}
			if(category_code){
				query += `
					AND (cb_objects.category_core='${category_code}')	
				`;
			}
			if(i != crunchbaseTypes.length - 1){
				query += ' UNION ';
			}
		}
		if(limit){
			query += ` LIMIT ${limit}`;
		}
		query += ';';
		return query;
	}

	formatDirectoryData(res){
		// Cannot use self.directoryColumns, because formatDirectoryData is passed as a
		// function parameter without the Database() object
		let directoryColumns = [
			'name', 'entity_type', 'homepage_url', 'logo_url', 'city',
			'description', 'short_description', 'overview',
			'cb_objects.id', 'cb_objects.status',
			'founded_at', 'cb_funding_rounds.funded_at',
			'first_funding_at', 'last_funding_at',
			'funding_total_usd', 
			'cb_funding_rounds.raised_amount_usd',
			'cb_funding_rounds.funding_round_type', 'cb_objects.category_code'
		];
		let entities = [];
		let data = [];
		if(res[0] !== undefined){
			data = res[0].values;
			console.log("dir data avail: " + data);
		}
		for(let element of data){
			let entity = {};
			for(let i = 0; i < element.length; i++){
				entity[directoryColumns[i]] = element[i];
			}
			entities.push(entity);
		}
		console.log('entities: ', entities)
		return entities;
	}

	linkQuery(yearMin,yearMax, cities, network_type){
		if(cities.length == 1){
			cities = `(\'${cities[0]}\')`;
		} else{
			cities = cities.map(city => `\'${city}\'`);
			cities = `(${cities.join(', ')})`;
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

	}

}