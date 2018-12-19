directoryColumns = [
			'name', 'entity_type', 'homepage_url', 'logo_url', 'city',
			'description', 'short_description', 'overview',
			'cb_objects.id', 'cb_objects.status',
			'founded_at', 'cb_funding_rounds.funded_at',
			'first_funding_at', 'last_funding_at',
			'funding_total_usd', 
			'cb_funding_rounds.raised_amount_usd',
			'cb_funding_rounds.funding_round_type', 'cb_objects.category_code'
		];

// SELECT funded_at, funded_object.name, investor_object.name, funded_object.category_code, cb_funding_rounds.raised_amount_usd, funded_object.state_code, funded_object.city, cb_funding_rounds.funding_round_type
// FROM cb_investments
// INNER JOIN cb_funding_rounds on cb_investments.funding_round_id=cb_funding_rounds.id
// INNER JOIN cb_objects as funded_object on cb_investments.funded_object_id=funded_object.id
// INNER JOIN cb_objects as investor_object on cb_investments.investor_object_id=investor_object.id
// WHERE 
// (funded_object.country_code=="USA")
// AND
// (STRFTIME('%Y', cb_funding_rounds.funded_at) in ('2012', '2013'))
// AND
// (funded_object.category_code in ('advertising'))
// AND
// (cb_funding_rounds.funding_round_type in ('series-a'))
// AND
// (funded_object.city in ('San Francisco'))


function directoryQuery(years, cities, funding_round_types, category_codes){
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
	if (cities.length>0) {
		query += "\nAND\nfunded_object.city in ("

		for (let i=0; i < cities.length; i++) {
			query += "\'" + cities[i] + "\'"
			if (i < cities.length-1) {
				query += ", "
			}
		}
		query += ")"
	}

	// Funding round types
	if (funding_round_types.length>0) {
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
	if (category_codes.length>0) {
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

	return query;
}


function formatDirectoryData(res){
		// Cannot use self.directoryColumns, because formatDirectoryData is passed as a
		// function parameter without the Database() object
		let directoryColumns = [
			'Funded date', 'Funded entity', 'Investor', 'Category', 'Amount', 'State', 'City', 'Funding round'
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



let test = directoryQuery(year=['2012'], cities=['San Francisco', 'New York City'], funding_round_type=['series-a'], category_code=['web'])
console.log(test);
