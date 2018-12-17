class VCMap {
    constructor(directoryChart,networkGraph, networkUpdate) {
        
        this.networkUpdate = networkUpdate;
        this.networkGraph = networkGraph;
        this.directoryChart = directoryChart;
        this.margin = {top: 20, right: 20, bottom: 30, left: 50};
        this.width = 1020 - this.margin.left - this.margin.right;
        this.height = 550 - this.margin.top - this.margin.bottom;
        this.current = 2013;
        this.maxYear = 2013;
        this.selectedCities = [];

        this.svg = d3.select("#vcMap").append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .attr("align","center")
            .attr("id", "vcMapChart");
        this.states = this.svg.append('g');
        this.dots = this.svg.append('g'); 
        this.projection = d3.geoAlbersUsa()
            .scale(1000)
            .translate([this.width / 2, this.height / 2]);
        this.tooltip = d3.tip()
            .attr('class', 'd3-tip')
            .direction('e')
            .html((city, funds) => {
                let template = `
                <h4>${city}</h4>
                <text>$${funds}</text>
                `;
                return template;

            });

        this.svg.call(this.tooltip);

        const stateLines = d3.geoPath()
            .projection(this.projection);
        
        d3.json('data/map/us2.json', (err, us) => {
            if(err) console.log(err);
            this.states.selectAll(".state")
                .data(topojson.feature(us, us.objects.usStates).features)
                .enter()
                    .append("path")
                        .attr("class", "state")
                        .attr("d", stateLines);
        });
        this.coords = new Promise((resolve, reject) => {
            d3.json('data/map/city_coordinates.json', (err, data) => {
                if(err) {
                    reject(err);
                }
                else {
                    resolve(data);
                }
            });
        });
    }
    initialize(data){
        this.data = JSON.parse(data);
    }
    
    update() {
        // console.log("initial data: " + Object.keys(this.data))
        let self = this;
        const scale = d3.scaleLog()
            .domain([10, 100000000])
            .range([0, 20]);
        let data = this.data;
        self.coords.then(cityCoordinates => {
            self.dots.selectAll('.city').remove();
            self.dots.selectAll('.city')
                .data(Object.keys(data))
                .enter()
                .append('circle')
                .merge(self.dots)
                    .classed('city', true)
                    .attr('cx', city => {
                        let x = 0;
                        let cityCoords = cityCoordinates[city.toUpperCase().trim()];
                        if(cityCoords) {
                            cityCoords.forEach(element => {
                                if (element[0] === 'USA'){
                                    let lat = element[1];
                                    let lon = element[2];
                                    x = self.projection([lon, lat])[0];
                                }
                            });
                        }
                        return x;
                    })
                    .attr('cy', city => {
                        let y = 0;
                        let cityCoords = cityCoordinates[city.toUpperCase().trim()];
                        if(cityCoords) {
                            cityCoords.forEach(element => {
                                if (element[0] === 'USA'){
                                    let lat = element[1];
                                    let lon = element[2];
                                    y = self.projection([lon, lat])[1];
                                }
                            });
                        }
                        return y;
                    })
                    .attr('r', city => {
                        let funds = 0;
                        let nextFunds = 0;
                        // console.log(self.current);
                        for (var i = self.current; i < self.maxYear+1; i++) {
                            nextFunds = data[city][i];
                            // console.log(nextFunds);
                            if ( (nextFunds != 0) && (typeof(nextFunds) != "undefined") ){
                                funds += nextFunds;
                            }
                        }

                        // let funds = data[city][self.current];
                        // console.log(data[city][self.current-1]);
                        if ( (funds === 0) || (typeof(funds) == "undefined") ){
                            return 0;
                        }
                        return scale(funds);
                    })
                    // .attr('r', city => {
                    //     let funds = data[city][self.current];
                    //     if ( (funds === 0) || (typeof(funds) == "undefined") ){
                    //         return 0;
                    //     }
                    //     return scale(funds);
                    // })
                    .on('mouseover', city => {
                        let funds = 0;
                        let nextFunds = 0;
                        for (var i = self.current; i < self.maxYear+1; i++) {
                            nextFunds = data[city][i];
                            if ( (nextFunds != 0) && (typeof(nextFunds) != "undefined") ){
                                funds += nextFunds
                            }
                        }
                        // let funds = data[city][self.current];
                        let format_funds = funds.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
                        self.tooltip.show(city, format_funds);
                    })
                    .on('mouseout', city => {
                        // let funds = data[city][self.current]; 
                        let funds = 0;
                        let nextFunds = 0;
                        for (var i = self.current; i < self.maxYear+1; i++) {
                            nextFunds = data[city][i];
                            if ( (nextFunds != 0) && (typeof(nextFunds) != "undefined") ){
                                funds += nextFunds
                            }
                        }
                        let format_funds = funds.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
                        self.tooltip.hide(city, format_funds);
                    })
                    // .on('mouseover', city => {
                    //     let funds = data[city][self.current];
                    //     let format_funds = funds.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
                    //     self.tooltip.show(city, format_funds);
                    // })
                    // .on('mouseout', city => {
                    //     let funds = data[city][self.current]; 
                    //     let format_funds = funds.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
                    //     self.tooltip.hide(city, format_funds);
                    // })
                    // On click update the directory chart based on the clicked city
                    .on('click', function(city) {
                        // If the city is selected, remove it from list of selected
                        if (self.selectedCities.indexOf(city) >= 0) {
                            let spliceIndex = self.selectedCities.indexOf(city);
                            self.selectedCities.splice(spliceIndex, 1);
                            d3.select(this).style('fill', 'rgb(217, 91, 67');
                        } 
                        // City is not selected. Update selected list
                        else {
                            self.selectedCities.push(city);
                            d3.select(this).style('fill', 'rgb(255,255,51)');
                        }
                        // Update the directory chart based on the list of selected cities
                        self.directoryChart.cities = self.selectedCities;
                        self.directoryChart.update();
                        let networkParams = {"yearMin":self.current,"yearMax":self.maxYear,"type":"city","cities":self.selectedCities};
                        self.networkUpdate(JSON.stringify(networkParams));
                    })
                    .style('fill', 'rgb(217,91,67)')	
                    .style('opacity', 0.85);
            self.dots.selectAll(".city[cx='0']").remove();
        });
    }
    changeYear(year, maxYear=2013){
        var self = this;
        self.current = year;
        self.maxYear = maxYear;
        self.update();
        
        self.selectedCities = [];
        self.directoryChart.cities = self.selectedCities;
        self.directoryChart.update();
        let networkParams = {"yearMin":self.current,"yearMax":self.maxYear,"type":"city","cities":self.selectedCities};
        self.networkUpdate(JSON.stringify(networkParams));
    }

}
