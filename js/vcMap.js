class VCMap {
    constructor(directoryChart,networkGraph, networkUpdate,DB) {

        this.networkUpdate = networkUpdate;
        this.networkGraph = networkGraph;
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
        this.scaleType = 'log';


        this.svg = d3.select("#vcMap").append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 "+this.width+" "+this.height)
            .attr("align","center")
            .attr("id", "vcMapChart");
            // .call(zoom);

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
            .direction('w')
            .html((city, funds, minYear, maxYear) => {
            var f_instance = M.FormSelect.getInstance($('#fundingType'));
            var c_instance = M.FormSelect.getInstance($('#categories'));

            let funding_round_types = f_instance.getSelectedValues();
            let catagory_codes= c_instance.getSelectedValues();

            let funding_round_type = '';
            for (let i=0; i < funding_round_types.length; i++) {
                funding_round_type += funding_round_types[i];
                if (i < funding_round_types.length-1) {
                    funding_round_type += ", "
                }
            }

            let catagory_code = '';
            for (let i=0; i < catagory_codes.length; i++) {
                catagory_code += catagory_codes[i];
                if (i < catagory_codes.length-1) {
                    catagory_code += ", "
                }
            }
            if (funding_round_type=="") { funding_round_type = "All funding rounds"};
            if (catagory_code=="") { catagory_code = "All categories"};

            let displayFunds = parseInt(funds.replace(",", "").replace(",", "").replace(",", ""));
            if (displayFunds > 999999999) {
                displayFunds = (displayFunds/1000000000)
                displayFunds = Math.round(displayFunds * 10) / 10;
                displayFunds = ("$" + displayFunds + "B");
            } else if (displayFunds > 999999) {
                displayFunds = (displayFunds/1000000)
                displayFunds = Math.round(displayFunds * 10) / 10;
                displayFunds = ("$" + displayFunds + "M");
            } else {
                displayFunds = ("$" + displayFunds);
            }

                let template = `
                <h4>${city} ${minYear}-${maxYear}</h4>
                <p>Fund type: ${funding_round_type}</p>
                <p>Venture category: ${catagory_code}</p>
                <p>Total amount invested: ${displayFunds}</p>
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

        this.scale = d3.scaleLog()
        .domain([1000, 20050000000])
        .range([0, 10]);
    }
    initialize(data){
        this.data = JSON.parse(data);
    }
    
    update() {
        let self = this;

        // const scale = d3.scaleLog()
        //     .domain([1000, 10000000000])
        //     .range([0, 10]);
        let data = this.data;
        let maxFunds = 0;
        let minFunds = 100000000000;
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
                        for (var i = self.current; i < self.maxYear+1; i++) {
                            nextFunds = data[city][i];
                            if ( (nextFunds != 0) && (typeof(nextFunds) != "undefined") ){
                                funds += nextFunds;
                            }
                        }
                        if ( (funds === 0) || (typeof(funds) == "undefined") ){
                            return 0;
                        }
                        // if (funds > maxFunds) {
                        //     maxFunds = funds;
                        //     if (this.scaleType=='linear') {
                        //         self.scale = d3.scaleLinear()
                        //                     .domain([minFunds, maxFunds])
                        //                     .range([0, 10]);
                        //     } else {
                        //         self.scale = d3.scaleLog()
                        //                     .domain([minFunds, maxFunds])
                        //                     .range([0, 10]);
                        //     }
                        // } else if (funds < minFunds) {
                        //     minFunds = funds;
                        //     if (this.scaleType=='linear') {
                        //         self.scale = d3.scaleLinear()
                        //                     .domain([minFunds, maxFunds])
                        //                     .range([0, 10]);
                        //     } else {
                        //         self.scale = d3.scaleLog()
                        //                     .domain([minFunds, maxFunds])
                        //                     .range([0, 10]);
                        //     }
                        // }

                        
                        return self.scale(funds);
                    })
                    .on('mouseover', city => {

                        let funds = 0;
                        let nextFunds = 0;
                        for (var i = self.current; i < self.maxYear+1; i++) {
                            nextFunds = data[city][i];
                            if ( (nextFunds != 0) && (typeof(nextFunds) != "undefined") ){
                                funds += nextFunds;
                            }
                        }
                        let format_funds = funds.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
                        self.tooltip.show(city, format_funds, this.current, this.maxYear);

                        // Get data for summary chart
                        var f_instance = M.FormSelect.getInstance($('#fundingType'));
                        var c_instance = M.FormSelect.getInstance($('#categories'));

                        let funding_round_types = f_instance.getSelectedValues();
                        let catagory_codes= c_instance.getSelectedValues();

                        let query = self.DB.lineQuery(funding_round_types, catagory_codes, city);
                        self.DB.processQuery(query, self.DB.formatLineData)
                            .then(e => {
                                lineData = e;
                                let tipCitySummary = new CitySummary(this.current, this.maxYear);
                                tipCitySummary.initiate(lineData);
                                tipCitySummary.update();
                                // timeSelector.initiate(lineData);
                            }, err => {
                                console.log(err);
                            });
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
                    // On click update the directory chart based on the clicked city
                    .on('click', function(city) {
                        // If the city is selected, remove it from list of selected
                        if (self.selectedCities.indexOf(city) >= 0) {
                            let spliceIndex = self.selectedCities.indexOf(city);
                            self.selectedCities.splice(spliceIndex, 1);
                            d3.select(this).style('fill', 'rgb(152,255,204)');
                        } 
                        // City is not selected. Update selected list
                        else {
                            self.selectedCities.push(city);
                            d3.select(this).style('fill', ' rgb(255,255,0)');
                        }
                        // Update the directory chart based on the list of selected cities
                        self.directoryChart.cities = self.selectedCities;
                        self.directoryChart.update();
                        let networkParams = {"yearMin":self.current,"yearMax":self.maxYear,"type":"city","cities":self.selectedCities};
                        self.networkUpdate(JSON.stringify(networkParams));
                    })
                    .style('fill', function(city) {
                        if (self.selectedCities.indexOf(city) >= 0) {
                            return "rgb(255,255,0)";
                        } else {
                            return "rgb(152,255,204)";
                        }
                        })	
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

    changeScale(scaleType) {
        var self = this;
        if (scaleType=="linear") {
            self.scale = d3.scaleLinear()
            .domain([1000, 10000000000])
            .range([0, 10]);
            this.scaleType = 'linear';
            self.update();
        }
        if (scaleType=="log") {
            self.scale = d3.scaleLog()
            .domain([1000, 10000000000])
            .range([0, 10]);
            this.scaleType = 'log';
            self.update();
        }
    }

}
