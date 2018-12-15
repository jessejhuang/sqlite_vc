const db = new Promise((resolve, reject) => {
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

const mapQuery = (funding_round_type)
/*
def mapQuery(funding_round_type=None, category_code=None, limit=None) :
	if funding_round_type=="None": funding_round_type=None
	if category_code=="None": category_code=None

	# Always select these fields
	query = 'SELECT cb_objects_venture.city, FORMAT(SUM(cb_funding_rounds.raised_amount), 0), YEAR(cb_funding_rounds.funded_at) as year'

	# Additional fields to select if specified
	if funding_round_type:
		query += ', cb_funding_rounds.funding_round_type'
	if category_code:
		query += ', cb_objects_venture.category_code'

	# Always merge these tables together
	query+=	'\nFROM cb_investments \n \
		INNER JOIN cb_funding_rounds ON cb_investments.funding_round_id=cb_funding_rounds.id \n \
		INNER JOIN cb_objects as cb_objects_venture ON cb_investments.funded_object_id=cb_objects_venture.id \n \
		INNER JOIN cb_objects as cb_objects_vc ON cb_investments.investor_object_id=cb_objects_vc.id'
	
	# Filter
	if funding_round_type or category_code:
		query += "\nWHERE"

	if funding_round_type:
		query += "\n(cb_funding_rounds.funding_round_type=\'" + funding_round_type+ "\')"

	if funding_round_type and category_code:
		query += " AND"

	if category_code:
		query += "\n(cb_objects_venture.category_code=\'" + category_code + "\')"

	# Grouping must align with selection
	query += '\nGROUP BY cb_objects_venture.city, year'

	if funding_round_type:
		query += ', cb_funding_rounds.funding_round_type'

	if category_code:
		query += ', cb_objects_venture.category_code'
	
	# Sort
	query += '\nORDER BY cb_objects_venture.city, year' 
	
	# Limit number of returned rows
	if limit:
		query += '\nLIMIT ' + str(limit)


	query += ";"
	return(query)
*/
export default db;