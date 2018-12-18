function lineQuery(funding_round_type="None", category_code="None") {
		let processFundingRound =true;
		let processCategoryCode =true;

		if (funding_round_type=="None") {
			processFundingRound=false;
		}
		if (category_code=="None") { 
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
		query += ";"
		return(query);
	}


let test = lineQuery(['series-a'], ['advertising', 'web'])
console.log(test);
