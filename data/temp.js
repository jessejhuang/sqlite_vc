function linkQuery(yearMin,yearMax, cities, funding_round_types, category_codes, network_type){
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
		SELECT t.source, t.target, CAST(t.raised_amount as TEXT) as raised_amount, t.source_logo_url, t.target_logo_url FROM \
			(SELECT cb_investments.investor_object_id, cb_investments.funded_object_id, \
			 SUM(cb_funding_rounds.raised_amount) as raised_amount, \
			 \nSTRFTIME('%Y', cb_funding_rounds.funded_at) as year, \
			 \ncb_objects_vc.name as source, cb_objects_vc.logo_url as source_logo_url, cb_objects_venture.name as target, cb_objects_venture.logo_url as target_logo_url \
		\nFROM cb_investments \
		\nINNER JOIN cb_funding_rounds ON cb_investments.funding_round_id=cb_funding_rounds.id  \
		\nINNER JOIN cb_objects as cb_objects_venture ON cb_investments.funded_object_id=cb_objects_venture.id  \
		\nINNER JOIN cb_objects as cb_objects_vc ON cb_investments.investor_object_id=cb_objects_vc.id \
	`;
	if(network_type === 'city' || !network_type){
		query += `
		\nWHERE (cb_objects_venture.city IN ${cities}) AND \
		\n(STRFTIME('%Y', cb_funding_rounds.funded_at) BETWEEN \'${yearMin}\' AND \'${yearMax}\')
		`;
if(funding_round_types){
			query += ` \nAND (cb_funding_rounds.funding_round_type ${funding_round_types}) `;
		}
		if(category_codes){
			query += ` \nAND (cb_objects_venture.category_code ${category_codes}) `;
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
	\nAND raised_amount != 0
	\nGROUP BY cb_investments.funded_object_id, cb_investments.investor_object_id, cb_funding_rounds.funded_at
	\nORDER BY raised_amount DESC) t LIMIT 40
	`;

console.log(query);
	return query;
}


let test = linkQuery(2013,2013, ['San Francisco'], [''], [''], 'city')
console.log(test);
