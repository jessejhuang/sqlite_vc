class DirectoryChart {

    constructor(profileChart, DB) {
			this.profileChart = profileChart;
			this.DB = DB;
					this.margin = {top: 20, right: 20, bottom: 30, left: 50};
			this.width = 350 - this.margin.left - this.margin.right;
			this.height = 500 - this.margin.top - this.margin.bottom;
			this.current = 2013;
			this.maxYear = 2013;
			this.cities = []; //Updated in vcMap.js when a user clicks a dot
			this.svg = d3.select('#org-list').append('svg')
				.attr("width", this.width + this.margin.left + this.margin.right)
				.attr("height", this.height + this.margin.top + this.margin.bottom)

			this.svg.append('a')
				// .attr('xlink:href', '#profileChart')
				.append('text')
					.attr("id", "directoryChart")
					// this.initialize();
    }

    initialize() {
    	// TODO: On initialization, set up an outline of the chart but don't load the data
    }

    // Called when a user clicks on a circle
    update() {
			let self = this;
			d3.select('#directoryChart').selectAll('tspan').remove();
				// Get info for entities filtered by:
				// Selected cities, selected category, selected funding type, selected year
				let fundingType = d3.select('#fundingType').property('value');
				let category = d3.select('#categories').property('value');

            let f_instance = M.FormSelect.getInstance($('#fundingType'));
            let c_instance = M.FormSelect.getInstance($('#categories'));

            let funding_round_types = f_instance.getSelectedValues();
            let catagory_codes= c_instance.getSelectedValues();

            if (funding_round_types[0]=="total") {funding_round_types = [];}
            if (catagory_codes[0]=="total") {catagory_codes = [];}

			// Update directory chart if cities are selected
			// directoryQuery(years, cities, funding_round_types, category_codes)
			let years = [];
			for (let j = this.current; j < this.maxYear+1; j++) {
				years.push(j);
			}
			// console.log(years);

			let query = self.DB.directoryQuery(years, [self.cities], [funding_round_types], [catagory_codes]);
			if(self.cities.length !== 0){
				console.log("min year: " + this.current);
				console.log("max year: " + this.maxYear);
				self.DB.processQuery(query, self.DB.formatDirectoryData)
					.then(e => {
						let directoryData = JSON.parse(JSON.stringify(e)).sort();
						let markup;
						$("#transaction-list thead").remove();
						$("#transaction-list tr").remove();

						// Header
						let header = "<thead><tr><th>Funded at</th><th>Funded entity</th><th>Investor</th><th>Raised amount</th><th>Category</th><th>Funding round</th><th>State</th><th>City</th></tr></thead>"
						$("#transaction-list").append(header);

						let maxRows = 100;
						for (let i=0; i < maxRows; i++) {
							let entityId = `entity${i}`
							let investorId = `investor${i}`
							markup = `
								<tr>	
									<td>${directoryData[i]['Funded at']}										 </td>
									<td id="${entityId}">${directoryData[i]['Funded entity']}</td>
									<td id="${investorId}">${directoryData[i]['Investor']}	 </td>
									<td>${directoryData[i]['Raised amount']}								 </td>
									<td>${directoryData[i]['Category']}											 </td>
									<td>${directoryData[i]['Funding round']}							   </td>
									<td>${directoryData[i]['State']}												 </td>
									<td>${directoryData[i]['City']}													 </td>
								</tr>
							`;
							$("table tbody").append(markup);
							d3.select(`#${entityId}`)
								.on('click', () => {
									self.profileChart.update(directoryData[i]['Funded entity']);
								});
							d3.select(`#${investorId}`)
								.on('click', () => {
									self.profileChart.update(directoryData[i]['Investor']);
								});
						}

// Category: "web"
// City: "San Francisco"
// Funded at: "2007-08-01"
// Funded entity: "FFWD Wheels"
// Funding round: "series-a"
// Investor: "Draper Fisher Jurvetson (DFJ)"
// Raised amount: 1700000
// State: "CA"
						// console.log("ayyy");
						// console.log(directoryData);
						// self.svg.attr('height', d3.max([500, directoryData.length * 20]));
						


					// 	d3.select('#directoryChart').selectAll('tspan')
					// 		.data(directoryData)
					// 		.enter()
					// 		.append('tspan')
					// 			.text(d => `${d.name}`)
					// 			.attr('x', 0)
					// 			.attr('dy', 20)
					// 			.on('click', d => {
					// 				self.profileChart.directoryUpdate(d);
					// 			})
					// 			.style('fill', d => {
					// 				if(d.entity_type === 'Company'){
					// 					return '#d9e4f3';
					// 				}
					// 				else{
					// 					return '#93bad7';
					// 				}
					// 			});
					// }, err => {
					// 	console.log(err);
					// }
				})
			}
    }

    // Called when the user clicks the timeline
	changeYear(minYear, maxYear){
		let self = this;
		self.current = minYear;
		this.maxYear = maxYear;
		self.update();
	}
}
// EOF