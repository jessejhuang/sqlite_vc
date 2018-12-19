SELECT t.source, t.target, CAST(t.raised_amount as TEXT) as raised_amount, t.source_logo_url, t.target_logo_url 
FROM 			
(SELECT cb_investments.investor_object_id, cb_investments.funded_object_id, SUM(cb_funding_rounds.raised_amount) as raised_amount, 			 
STRFTIME('%Y', cb_funding_rounds.funded_at) as year, 			 
cb_objects_vc.name as source, cb_objects_vc.logo_url as source_logo_url, cb_objects_venture.name as target, cb_objects_venture.logo_url as target_logo_url 	
FROM cb_investments 		
INNER JOIN cb_funding_rounds ON cb_investments.funding_round_id=cb_funding_rounds.id  		
INNER JOIN cb_objects as cb_objects_venture ON cb_investments.funded_object_id=cb_objects_venture.id  		
INNER JOIN cb_objects as cb_objects_vc ON cb_investments.investor_object_id=cb_objects_vc.id 	
		
WHERE (cb_objects_venture.city IN ('San Francisco')) AND 		
(STRFTIME('%Y', cb_funding_rounds.funded_at) BETWEEN '2000' AND '2013')
		 
AND (cb_funding_rounds.funding_round_type IS NOT NULL)  
AND (cb_objects_venture.category_code IS NOT NULL) 
	
AND raised_amount != 0
	
GROUP BY cb_investments.funded_object_id, cb_investments.investor_object_id, cb_funding_rounds.funded_at
	
ORDER BY raised_amount DESC) t LIMIT 40
