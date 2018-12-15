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
}