class Database{
	constructor(){
		this.db = new Promise((resolve, reject) => {
			d3.request('data/raw_crunchbase.db')
				.header("X-Requested-With", "XMLHttpRequest")
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
				console.log('ffooooo')
				console.log(query)
				let response = database.exec(query);
				if (formatFunction){
					resolve(formatFunction(response));
				}
				else{
					resolve(response);
				}
			}, err => {
				reject(err)
			});
		});
	}

	mapQuery(funding_round_type, category_code, limit){
		// Always select these fields
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
				query += `(cb_funding_rounds.funding_round_type='${funding_round_type}') `;
			}
			if(funding_round_type && category_code){
				query += 'AND ';
			}
			if(category_code){
				query += ` (cb_objects_venture.category_code='${category_code}') `;
			}
		}
		// Grouping must align with selection
		query += 'GROUP BY cb_objects_venture.city, year '
	
		if(funding_round_type){
			query += ', cb_funding_rounds.funding_round_type'
		}
		if(category_code){
			query += ', cb_objects_venture.category_code '
		}
		//Sort
		query += ' ORDER BY cb_objects_venture.city, year'
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
		let cities = {}
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

	filtersQuery(field, table){
		return `SELECT ${field} FROM ${table} GROUP BY ${field}`;
	}

	formatFilterData(res){
		let filters = []
		let data = res[0].values;
		for(let element of data){
			filters.push(element[0]);
		}
		return filters;
	}

	directoryQuery(year, cities, funding_round_type, category_code, limit){
		// Retrieve info for list of entities
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
			for(let j = 0; j < directoryColumns.length; j++){
				query += ` ${directoryColumns[j]}`;
				if(j !== directoryColumns.length - 1){
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
			// query += `
			// 	WHERE (entity_type='${crunchbaseTypes[i]}') AND	
			// 	(city IN ${cities})
			// `;
			query += `
				WHERE (entity_type='${crunchbaseTypes[i]}') AND	
				(city IN ${cities}) AND
				(STRFTIME('%Y', cb_funding_rounds.funded_at)=\'${year}\')
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
				query += ' UNION '
			}
		}
		if(limit){
			query += ` LIMIT ${limit}`;
		}
		query += ';'
		return query;
	}

	formatDirectoryData(res){
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

		let entities = []
		console.log(res);
		let data = res[0].values;
		console.log(data);
		for(let element of data){
			let entity = {}
			for(let i = 0; i < element.length; i++){
				entity[directoryColumns[i]] = element[i];
			}
			entities.push(entity);
		}
		console.log(entities);
		return entities;
	}
}