SELECT funded_at, funded_object.name, investor_object.name, funded_object.category_code, cb_funding_rounds.raised_amount_usd, funded_object.state_code, funded_object.city, cb_funding_rounds.funding_round_type
FROM cb_investments
INNER JOIN cb_funding_rounds on cb_investments.funding_round_id=cb_funding_rounds.id
INNER JOIN cb_objects as funded_object on cb_investments.funded_object_id=funded_object.id
INNER JOIN cb_objects as investor_object on cb_investments.investor_object_id=investor_object.id
WHERE
(funded_object.country_code=="USA")
AND
STRFTIME('%Y', cb_funding_rounds.funded_at) in ('2012')
AND
funded_object.city in ('San Francisco', 'New York City')
AND
cb_funding_rounds.funding_round_type in ('series-a')
AND
funded_object.category_code in ('web')
ORDER BY cb_funding_rounds.raised_amount_usd DESC, funded_at DESC;