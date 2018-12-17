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
				.attr('xlink:href', '#profileChart')
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

    	// let query = {"year": this.current,
    	// 		"fundingType": fundingType,
    	// 		"category": category,
    	// 		"cities": this.cities};


		// Update directory chart if cities are selected
		let query = self.DB.directoryQuery(self.current, self.cities, fundingType, category, undefined);
		if(self.cities.length !== 0){
			self.DB.processQuery(query, self.DB.formatDirectoryData)
				.then(e => {
					let directoryData = JSON.parse(JSON.stringify(e)).sort();
					self.svg.attr('height', d3.max([500, directoryData.length * 20]));
					d3.select('#directoryChart').selectAll('tspan')
						.data(directoryData)
						.enter()
						.append('tspan')
							.text(d => `${d.name}`)
							.attr('x', 0)
							.attr('dy', 20)
							.on('click', d => {
								self.profileChart.directoryUpdate(d);
							})
							.style('fill', d => {
								if(d.entity_type === 'Company'){
									return '#d9e4f3';
								}
								else{
									return '#93bad7';
								}
							});
				}, err => {
					console.log(err);
				})
		}
    	// if (self.cities.length!=0) {
	    //     $.ajax({
	    //         type: 'POST',
	    //         contentType: 'application/json',
	    //         data: JSON.stringify(query),
	    //         dataType: 'json',
	    //         url: 'directory',
	    //         success: function (e) {
	    //             let directoryData = JSON.parse(JSON.stringify(e)).sort();
		// 			self.svg.attr('height', d3.max([500, directoryData.length * 20]));
		// 			d3.select('#directoryChart').selectAll('tspan')
		// 				.data(directoryData)
		// 				.enter()
		// 				.append('tspan')
		// 					.text(d => `${d.name}`)
		// 					.attr('x', 0)
		// 					.attr('dy', 20)
		// 					.on('click', d => {
		// 						self.profileChart.directoryUpdate(d);
		// 					})
		// 					.style('fill', d => {
		// 						console.log(d)
		// 						if(d.entity_type === 'Company'){
		// 							return '#d9e4f3';
		// 						}
		// 						else{
		// 							return '#93bad7';
		// 						}
		// 					})
	    //         },
	    //         error: function(error) {
	    //             console.log(error);
	    //         }
	    //     });
		// }
    }

    // Called when the user clicks the timeline
	changeYear(year){
		let self = this;
		self.current = year;
		self.update();
	}
}
// EOF