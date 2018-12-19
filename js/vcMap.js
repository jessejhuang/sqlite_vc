class VCMap {
    constructor(directoryChart,networkGraph, networkUpdate,DB) {
        // console.log("On construction: " + DB);

        this.networkUpdate = networkUpdate;
        this.networkGraph = networkGraph;
        //this.DB = new Database();
        this.DB = DB;
        this.directoryChart = directoryChart;
        this.margin = {top: 20, right: 20, bottom: 30, left: 50};
        this.width = 1020 - this.margin.left - this.margin.right;
        this.height = 550 - this.margin.top - this.margin.bottom;
        this.width_full = 1020;
        this.height_full = 550;
        this.current = 2013;
        this.maxYear = 2013;
        this.selectedCities = [];

        function zoomed(){
          d3.select("#vcMapChart").attr("transform", d3.event.transform);
        }  

        const zoom = d3.zoom()
            .scaleExtent([1, 40])
            .translateExtent([[0,0], [this.width, this.height]])
            .extent([[this.margin.left, this.margin.top], [this.margin.left+this.width, this.margin.top+this.height]])
            .on("zoom", zoomed);



        this.svg = d3.select("#vcMap").append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 "+this.width+" "+this.height)
            //.attr("width", this.width + this.margin.left + this.margin.right)
            //.attr("height", this.height + this.margin.top + this.margin.bottom)
            .attr("align","center")
            .attr("id", "vcMapChart")
            .call(zoom);

        // Define the SVG clipPath
        this.clip = this.svg.append("defs")
          .append("clipPath")
            .attr("id", "rect-clip")
          .append("rect")
            .attr("id", "my-rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .style('stroke', 'black')
            .style('stroke-width', '5px')
            .style('fill-opacity', 0);


        this.states = this.svg.append('g')
                            .attr("clip-path", "url(#rect-clip)");
        this.dots = this.svg.append('g'); 
        this.projection = d3.geoAlbersUsa()
            .scale(1000)
            .translate([this.width / 2, this.height / 2]);
        this.tooltip = d3.tip()
            .attr('class', 'd3-tip')
            .direction('e')
            .html((city, funds, minYear, maxYear) => {
            let funding_round_type = d3.select('#fundingType').property('value');
            let catagory_code = d3.select('#categories').property('value');
            if (funding_round_type=="") { funding_round_type = "All"};
            if (catagory_code=="") { catagory_code = "All"};

                let template = `
                <h4>${city} ${minYear}-${maxYear}</h4>
                <p>Fund type: ${funding_round_type}</p>
                <p>Venture category: ${catagory_code}</p>
                <p>Amount: $${funds}</p>
                <div id='tipDiv'></div>
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
                        .attr("d", stateLines)
                        .style('fill', "black");
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
        const toolTipScale = d3.scaleLog()
            .domain([10, 10000000000])
            .range([0, 190]);
        const scale = d3.scaleLog()
            .domain([10, 10000000000])
            .range([0, 10]);
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
                                funds += nextFunds;
                            }
                        }
                        // let funds = data[city][self.current];
                        let format_funds = funds.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
                        self.tooltip.show(city, format_funds, this.current, this.maxYear);

                        // Get data for summary chart
                        // let funding_round_type = d3.select('#fundingType').property('value');
                        // let catagory_code = d3.select('#categories').property('value');

                        // let query = self.DB.lineQuery(funding_round_type, catagory_code);
                        // self.DB.processQuery(query, self.DB.formatLineData)
                        //     .then(e => {
                        //         lineData = e;
                                // console.log("new line dataaaaaaa: " + lineData);

                        let tipSVG = d3.select("#tipDiv")
                                      .append("svg")
                                      .attr("width", 200)
                                      .attr("height", 50);



                            tipSVG.append("rect")
                            .attr("fill", "rgb(152,255,204)")
                            .attr("y", 10)
                            .attr("width", 0)
                            .attr("height", 30)
                            .transition()
                            .duration(500)
                            .attr("width", toolTipScale(funds));

                                // for (let k = 0; k < lineData.length; k++) {
                                //     tipSVG.append("rect")
                                //     .attr("fill", "steelblue")
                                //     .attr("y", k*10)
                                //     .attr("width", 0)
                                //     .attr("height", 30)
                                //     .transition()
                                //     .duration(500)
                                //     .attr("width", k * 6);
                                // }

                                    // if (element[0] === 'USA'){
                                    //     let lat = element[1];
                                    //     let lon = element[2];
                                    //     x = self.projection([lon, lat])[0];
                                    // }
                             


                                                // tipSVG.append("rect")
                                                // .attr("fill", "steelblue")
                                                // .attr("y", 10)
                                                // .attr("width", 0)
                                                // .attr("height", 30)
                                                // .transition()
                                                // .duration(1000)
                                                // .attr("width", 3 * 6);

                                            // tipSVG.append("text")
                                            //   .text("ay")
                                            //   .attr("x", 10)
                                            //   .attr("y", 30)
                                            //   .transition()
                                            //   .duration(1000)
                                            //   .attr("x", 6 + 3 * 6)
                                // timeSelector.initiate(lineData);
                            // });

                    })
                    .on('mouseout', city => {
                        // let funds = data[city][self.current]; 
                        let funds = 0;
                        let nextFunds = 0;
                        for (var i = self.current; i < self.maxYear+1; i++) {
                            nextFunds = data[city][i];
                            if ( (nextFunds != 0) && (typeof(nextFunds) != "undefined") ){
                                funds += nextFunds;
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
                            d3.select(this).style('fill', 'rgb(152,255,204)');
                        }
                        // Update the directory chart based on the list of selected cities
                        self.directoryChart.cities = self.selectedCities;
                        self.directoryChart.update();
                        let networkParams = {"yearMin":self.current,"yearMax":self.maxYear,"type":"city","cities":self.selectedCities};
                        self.networkUpdate(JSON.stringify(networkParams));
                    })
                    .style('fill', "rgb(152,255,204)")	
                    .style('opacity', 1);
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
