SELECT
	cb_objects_venture.city,
	cb_funding_rounds.raised_amount,
	cb_funding_rounds.funded_at as year , cb_funding_rounds.funding_round_type , cb_objects_venture.category_code 
FROM cb_investments
INNER JOIN cb_funding_rounds ON cb_investments.funding_round_id=cb_funding_rounds.id
INNER JOIN cb_objects as cb_objects_venture ON cb_investments.funded_object_id=cb_objects_venture.id
INNER JOIN cb_objects as cb_objects_vc ON cb_investments.investor_object_id=cb_objects_vc.id 
WHERE 
 (cb_objects_venture.country_code='USA') 
 AND 
 (cb_objects_venture.state_code!='None')
 AND
(cb_funding_rounds.funding_round_type IN ('series-b')) 
AND  (cb_objects_venture.category_code IN ('cleantech')) 
GROUP BY cb_objects_venture.city, year , cb_funding_rounds.funding_round_type, cb_objects_venture.category_code  
ORDER BY cb_objects_venture.city, year;